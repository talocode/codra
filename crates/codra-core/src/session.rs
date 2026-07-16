use crate::agent_loop::{AgentConfig, AgentLoop, AgentLoopResult, AgentMessage};
use crate::tool_dispatcher::ToolDispatcher;
use crate::provider::IntelligenceProvider;
use std::sync::Arc;
use tokio::sync::{mpsc, oneshot, Mutex};

pub enum SessionCommand {
    Prompt {
        content: String,
        respond_to: oneshot::Sender<Result<AgentLoopResult, String>>,
    },
    Cancel,
    Shutdown,
}

pub enum SessionNotification {
    TurnStarted { turn: usize },
    TurnCompleted { result: AgentLoopResult },
    ToolCallStarted { tool_name: String },
    ToolCallCompleted { tool_name: String, success: bool },
    Compacted { message_count: usize },
    Error { message: String },
}

pub struct SessionActor {
    command_rx: mpsc::Receiver<SessionCommand>,
    notification_tx: mpsc::Sender<SessionNotification>,
    conversation: Vec<AgentMessage>,
    agent_config: AgentConfig,
}

impl SessionActor {
    pub fn new(
        command_rx: mpsc::Receiver<SessionCommand>,
        notification_tx: mpsc::Sender<SessionNotification>,
        agent_config: AgentConfig,
    ) -> Self {
        Self {
            command_rx,
            notification_tx,
            conversation: vec![],
            agent_config,
        }
    }

    pub async fn run(
        &mut self,
        provider: Arc<dyn IntelligenceProvider + Send + Sync>,
        dispatcher: Arc<Mutex<dyn ToolDispatcher + Send + Sync>>,
    ) {
        while let Some(command) = self.command_rx.recv().await {
            match command {
                SessionCommand::Prompt {
                    content,
                    respond_to,
                } => {
                    let result = self
                        .handle_prompt(&content, &provider, &dispatcher)
                        .await;
                    let _ = respond_to.send(result);
                }
                SessionCommand::Cancel => {
                    self.conversation.clear();
                }
                SessionCommand::Shutdown => {
                    break;
                }
            }
        }
    }

    async fn handle_prompt(
        &mut self,
        prompt: &str,
        provider: &Arc<dyn IntelligenceProvider + Send + Sync>,
        dispatcher: &Arc<Mutex<dyn ToolDispatcher + Send + Sync>>,
    ) -> Result<AgentLoopResult, String> {
        let _ = self
            .notification_tx
            .send(SessionNotification::TurnStarted {
                turn: self.conversation.len(),
            })
            .await;

        let agent = AgentLoop::new(provider.as_ref(), dispatcher.clone(), self.agent_config.clone());
        let result = agent.run(prompt, &mut self.conversation).await;

        let _ = self
            .notification_tx
            .send(SessionNotification::TurnCompleted {
                result: result.clone().unwrap_or_else(|e| AgentLoopResult {
                    final_text: format!("Error: {}", e),
                    turns: 0,
                    tool_calls_made: 0,
                    token_usage: codra_protocol::TokenUsage {
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0,
                    },
                    messages: vec![],
                }),
            })
            .await;

        result
    }
}

pub fn spawn_session(
    provider: Arc<dyn IntelligenceProvider + Send + Sync>,
    dispatcher: Arc<Mutex<dyn ToolDispatcher + Send + Sync>>,
    config: AgentConfig,
) -> (
    mpsc::Sender<SessionCommand>,
    mpsc::Receiver<SessionNotification>,
) {
    let (cmd_tx, cmd_rx) = mpsc::channel(32);
    let (notif_tx, notif_rx) = mpsc::channel(64);

    let mut actor = SessionActor::new(cmd_rx, notif_tx, config);

    tokio::spawn(async move {
        actor.run(provider, dispatcher).await;
    });

    (cmd_tx, notif_rx)
}
