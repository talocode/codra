use crate::agent_loop::AgentMessage;
use crate::provider::IntelligenceProvider;
use codra_protocol::{GenerationMode, GenerationRequest};

#[derive(Debug, Clone)]
pub struct CompactionPolicy {
    pub auto_compact_threshold: f64,
    pub max_summary_tokens: usize,
}

impl Default for CompactionPolicy {
    fn default() -> Self {
        Self {
            auto_compact_threshold: 0.85,
            max_summary_tokens: 4096,
        }
    }
}

pub struct CompactionService {
    policy: CompactionPolicy,
}

impl CompactionService {
    pub fn new(policy: CompactionPolicy) -> Self {
        Self { policy }
    }

    pub fn should_compact(&self, current_tokens: usize, context_window: usize) -> bool {
        if context_window == 0 {
            return false;
        }
        let ratio = current_tokens as f64 / context_window as f64;
        ratio >= self.policy.auto_compact_threshold
    }

    pub async fn compact(
        &self,
        conversation: &mut Vec<AgentMessage>,
        provider: &dyn IntelligenceProvider,
    ) -> Result<(), String> {
        if conversation.is_empty() {
            return Ok(());
        }

        let summary = self.generate_summary(conversation, provider).await?;

        let system_msg = conversation
            .iter()
            .find(|m| m.role == "system")
            .cloned();

        let recent_tail: Vec<AgentMessage> = conversation
            .iter()
            .rev()
            .take(4)
            .cloned()
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();

        conversation.clear();

        if let Some(sys) = system_msg {
            conversation.push(sys);
        }

        conversation.push(AgentMessage {
            role: "user".to_string(),
            content: format!("[Conversation Summary]\n{}\n[End Summary]", summary),
            tool_calls: vec![],
            tool_call_id: None,
        });

        for msg in recent_tail {
            conversation.push(msg);
        }

        Ok(())
    }

    async fn generate_summary(
        &self,
        conversation: &[AgentMessage],
        provider: &dyn IntelligenceProvider,
    ) -> Result<String, String> {
        let conversation_text: String = conversation
            .iter()
            .map(|m| {
                let role = &m.role;
                let content = if m.content.len() > 500 {
                    &m.content[..500]
                } else {
                    &m.content
                };
                format!("{}: {}", role, content)
            })
            .collect::<Vec<_>>()
            .join("\n");

        let request = GenerationRequest {
            mode: GenerationMode::PlanGeneration,
            system_prompt: "Summarize the following conversation concisely. Keep key decisions, file paths, tool results, and current state. Output only the summary.".to_string(),
            user_prompt: conversation_text,
            max_tokens: Some(self.policy.max_summary_tokens as i64),
            temperature: Some(0.1),
        };

        let response = provider.generate(&request)?;
        Ok(response.content)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_compact_at_threshold() {
        let service = CompactionService::new(CompactionPolicy {
            auto_compact_threshold: 0.85,
            ..Default::default()
        });
        assert!(!service.should_compact(84, 100));
        assert!(service.should_compact(85, 100));
        assert!(service.should_compact(100, 100));
    }

    #[test]
    fn should_not_compact_empty_context() {
        let service = CompactionService::new(CompactionPolicy::default());
        assert!(!service.should_compact(100, 0));
    }
}
