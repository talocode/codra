pub struct TokenCounter {
    context_window: usize,
}

impl TokenCounter {
    pub fn new() -> Self {
        Self {
            context_window: 128_000,
        }
    }

    pub fn with_context_window(mut self, window: usize) -> Self {
        self.context_window = window;
        self
    }

    pub fn context_window(&self) -> usize {
        self.context_window
    }

    pub fn estimate_conversation(&self, messages: &[crate::agent_loop::AgentMessage]) -> usize {
        messages
            .iter()
            .map(|m| self.estimate_message(m))
            .sum()
    }

    fn estimate_message(&self, msg: &crate::agent_loop::AgentMessage) -> usize {
        let content_tokens = self.estimate_tokens(&msg.content);
        let tool_call_tokens: usize = msg
            .tool_calls
            .iter()
            .map(|tc| {
                let args_str = serde_json::to_string(&tc.arguments).unwrap_or_default();
                self.estimate_tokens(&tc.tool_name) + self.estimate_tokens(&args_str) + 4
            })
            .sum();
        content_tokens + tool_call_tokens + 4
    }

    fn estimate_tokens(&self, text: &str) -> usize {
        // Rough estimate: ~4 chars per token, minimum 1 token for non-empty text
        let chars = text.len();
        if chars == 0 { 0 } else { (chars + 3) / 4 }
    }
}

impl Default for TokenCounter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_loop::AgentMessage;

    #[test]
    fn estimate_tokens_basic() {
        let counter = TokenCounter::new();
        // "hello" = 5 chars -> (5+3)/4 = 2
        assert_eq!(counter.estimate_tokens("hello"), 2);
        // "hello world test" = 16 chars -> (16+3)/4 = 4
        assert_eq!(counter.estimate_tokens("hello world test"), 4);
    }

    #[test]
    fn estimate_conversation() {
        let counter = TokenCounter::new();
        let messages = vec![
            AgentMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
                tool_calls: vec![],
                tool_call_id: None,
            },
            AgentMessage {
                role: "assistant".to_string(),
                content: "Hi there!".to_string(),
                tool_calls: vec![],
                tool_call_id: None,
            },
        ];
        let tokens = counter.estimate_conversation(&messages);
        assert!(tokens > 0);
    }
}
