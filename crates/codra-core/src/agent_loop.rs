use crate::compaction::{CompactionPolicy, CompactionService};
use crate::hooks::{HookDecision, HookEvent, HookSystem};
use crate::provider::IntelligenceProvider;
use crate::token_counter::TokenCounter;
use crate::tool_dispatcher::{ToolCall, ToolDispatcher, ToolOutput};
use codra_protocol::{GenerationRequest, TokenUsage};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub role: String,
    pub content: String,
    #[serde(default)]
    pub tool_calls: Vec<ToolCall>,
    #[serde(default)]
    pub tool_call_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub system_prompt: String,
    pub max_turns: usize,
    pub max_tokens: Option<i64>,
    pub temperature: Option<f64>,
    #[serde(default = "default_auto_compact")]
    pub auto_compact_threshold: f64,
}

fn default_auto_compact() -> f64 {
    0.85
}

#[derive(Debug, Clone)]
pub struct TurnSummary {
    pub turn_number: usize,
    pub messages_added: usize,
    pub tool_calls_made: usize,
    pub token_usage: Option<TokenUsage>,
    pub compacted: bool,
}

pub struct AgentLoop<'a> {
    provider: &'a dyn IntelligenceProvider,
    dispatcher: Arc<Mutex<dyn ToolDispatcher + Send + Sync>>,
    hook_system: HookSystem,
    token_counter: TokenCounter,
    compaction_service: CompactionService,
    config: AgentConfig,
}

impl<'a> AgentLoop<'a> {
    pub fn new(
        provider: &'a dyn IntelligenceProvider,
        dispatcher: Arc<Mutex<dyn ToolDispatcher + Send + Sync>>,
        config: AgentConfig,
    ) -> Self {
        Self {
            provider,
            dispatcher,
            hook_system: HookSystem::new(),
            token_counter: TokenCounter::new(),
            compaction_service: CompactionService::new(CompactionPolicy {
                auto_compact_threshold: config.auto_compact_threshold,
                ..Default::default()
            }),
            config,
        }
    }

    pub fn with_hooks(mut self, hooks: HookSystem) -> Self {
        self.hook_system = hooks;
        self
    }

    pub async fn run(
        &self,
        user_prompt: &str,
        conversation: &mut Vec<AgentMessage>,
    ) -> Result<AgentLoopResult, String> {
        let mut total_turns = 0;
        let mut total_tool_calls = 0;
        let mut accumulated_usage = TokenUsage {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
        };

        conversation.push(AgentMessage {
            role: "user".to_string(),
            content: user_prompt.to_string(),
            tool_calls: vec![],
            tool_call_id: None,
        });

        for turn in 0..self.config.max_turns {
            total_turns = turn + 1;

            let estimated_tokens = self.token_counter.estimate_conversation(conversation);
            let context_window = self.token_counter.context_window();

            if self.compaction_service.should_compact(estimated_tokens, context_window) {
                self.compaction_service
                    .compact(conversation, self.provider)
                    .await?;
            }

            let tool_defs = self.dispatcher.lock().await.tool_definitions();

            let request = self.build_request(conversation, &tool_defs);

            let response = self.provider.generate(&request).map_err(|e| {
                format!(
                    "LLM generation failed on turn {}: {}",
                    turn + 1,
                    e
                )
            })?;

            if let Some(ref usage) = response.token_usage {
                accumulated_usage.prompt_tokens += usage.prompt_tokens;
                accumulated_usage.completion_tokens += usage.completion_tokens;
                accumulated_usage.total_tokens += usage.total_tokens;
            }

            let parsed = self.parse_response(&response.content)?;

            match parsed {
                ResponseParse::TextOnly(text) => {
                    conversation.push(AgentMessage {
                        role: "assistant".to_string(),
                        content: text.clone(),
                        tool_calls: vec![],
                        tool_call_id: None,
                    });
                    return Ok(AgentLoopResult {
                        final_text: text,
                        turns: total_turns,
                        tool_calls_made: total_tool_calls,
                        token_usage: accumulated_usage,
                        messages: conversation.clone(),
                    });
                }
                ResponseParse::WithToolCalls(text, tool_calls) => {
                    conversation.push(AgentMessage {
                        role: "assistant".to_string(),
                        content: text,
                        tool_calls: tool_calls.clone(),
                        tool_call_id: None,
                    });

                    let results = self
                        .execute_tool_calls(&tool_calls, conversation)
                        .await?;
                    total_tool_calls += results.len();

                    for result in results {
                        conversation.push(AgentMessage {
                            role: "tool".to_string(),
                            content: result.output,
                            tool_calls: vec![],
                            tool_call_id: Some(result.call_id),
                        });
                    }
                }
            }
        }

        Ok(AgentLoopResult {
            final_text: "Max turns reached without completion.".to_string(),
            turns: total_turns,
            tool_calls_made: total_tool_calls,
            token_usage: accumulated_usage,
            messages: conversation.clone(),
        })
    }

    fn build_request(
        &self,
        conversation: &[AgentMessage],
        tool_defs: &[codra_protocol::ToolDefinition],
    ) -> GenerationRequest {
        let mut messages_text = String::new();
        messages_text.push_str(&self.config.system_prompt);
        messages_text.push_str("\n\n");

        for msg in conversation {
            match msg.role.as_str() {
                "user" => {
                    messages_text.push_str(&format!("User: {}\n\n", msg.content));
                }
                "assistant" => {
                    if !msg.tool_calls.is_empty() {
                        let call_desc: Vec<String> = msg
                            .tool_calls
                            .iter()
                            .map(|c| {
                                format!(
                                    "{}({})",
                                    c.tool_name,
                                    serde_json::to_string(&c.arguments).unwrap_or_default()
                                )
                            })
                            .collect();
                        messages_text.push_str(&format!(
                            "Assistant: {}\nTool calls: {}\n\n",
                            msg.content,
                            call_desc.join(", ")
                        ));
                    } else {
                        messages_text.push_str(&format!("Assistant: {}\n\n", msg.content));
                    }
                }
                "tool" => {
                    messages_text.push_str(&format!(
                        "Tool result ({}): {}\n\n",
                        msg.tool_call_id.as_deref().unwrap_or("unknown"),
                        msg.content
                    ));
                }
                _ => {}
            }
        }

        if !tool_defs.is_empty() {
            let tool_descs: Vec<String> = tool_defs
                .iter()
                .map(|t| format!("- {}: {}", t.name, t.description))
                .collect();
            messages_text.push_str(&format!(
                "\nAvailable tools:\n{}\n\nTo use a tool, respond with: [TOOL_CALL: tool_name(args)]\n",
                tool_descs.join("\n")
            ));
        }

        GenerationRequest {
            mode: codra_protocol::GenerationMode::PlanGeneration,
            system_prompt: self.config.system_prompt.clone(),
            user_prompt: messages_text,
            max_tokens: self.config.max_tokens,
            temperature: self.config.temperature,
        }
    }

    fn parse_response(&self, content: &str) -> Result<ResponseParse, String> {
        let mut tool_calls = Vec::new();
        let mut text_parts = Vec::new();

        for line in content.lines() {
            if let Some(rest) = line.strip_prefix("[TOOL_CALL: ") {
                if let Some(end) = rest.find(']') {
                    let call_str = &rest[..end];
                    if let Some(paren_start) = call_str.find('(') {
                        if let Some(paren_end) = call_str.rfind(')') {
                            let tool_name =
                                call_str[..paren_start].trim().to_string();
                            let args_str = &call_str[paren_start + 1..paren_end];
                            let arguments: serde_json::Value =
                                serde_json::from_str(&format!("{{{}}}", args_str))
                                    .unwrap_or(serde_json::Value::Object(
                                        serde_json::Map::new(),
                                    ));
                            tool_calls.push(ToolCall {
                                id: format!("call_{}", uuid::Uuid::new_v4()),
                                tool_name,
                                arguments,
                            });
                            continue;
                        }
                    }
                }
            }
            text_parts.push(line);
        }

        let text = text_parts.join("\n").trim().to_string();

        if tool_calls.is_empty() {
            Ok(ResponseParse::TextOnly(text))
        } else {
            Ok(ResponseParse::WithToolCalls(text, tool_calls))
        }
    }

    async fn execute_tool_calls(
        &self,
        tool_calls: &[ToolCall],
        _conversation: &[AgentMessage],
    ) -> Result<Vec<ToolOutput>, String> {
        let mut results = Vec::new();

        for call in tool_calls {
            let hook_decision = self
                .hook_system
                .dispatch(HookEvent::PreToolUse {
                    tool_name: call.tool_name.clone(),
                    arguments: call.arguments.clone(),
                })
                .await;

            if let HookDecision::Deny { reason } = hook_decision {
                results.push(ToolOutput {
                    call_id: call.id.clone(),
                    success: false,
                    output: format!("Tool call denied by hook: {}", reason),
                });
                continue;
            }

            let mut dispatcher = self.dispatcher.lock().await;
            let result = dispatcher.execute_tool(call).await;

            self.hook_system
                .dispatch(HookEvent::PostToolUse {
                    tool_name: call.tool_name.clone(),
                    success: result.is_ok(),
                })
                .await;

            match result {
                Ok(output) => results.push(output),
                Err(e) => {
                    results.push(ToolOutput {
                        call_id: call.id.clone(),
                        success: false,
                        output: format!("Tool execution error: {}", e),
                    });
                }
            }
        }

        Ok(results)
    }
}

enum ResponseParse {
    TextOnly(String),
    WithToolCalls(String, Vec<ToolCall>),
}

#[derive(Debug, Clone)]
pub struct AgentLoopResult {
    pub final_text: String,
    pub turns: usize,
    pub tool_calls_made: usize,
    pub token_usage: TokenUsage,
    pub messages: Vec<AgentMessage>,
}
