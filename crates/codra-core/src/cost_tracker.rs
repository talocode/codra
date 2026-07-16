use crate::agent_loop::AgentMessage;
use crate::provider::IntelligenceProvider;

pub struct CostTracker {
    total_prompt_tokens: i64,
    total_completion_tokens: i64,
    total_cost_usd: f64,
    cost_per_1k_prompt: f64,
    cost_per_1k_completion: f64,
}

impl CostTracker {
    pub fn new(cost_per_1k_prompt: f64, cost_per_1k_completion: f64) -> Self {
        Self {
            total_prompt_tokens: 0,
            total_completion_tokens: 0,
            total_cost_usd: 0.0,
            cost_per_1k_prompt,
            cost_per_1k_completion,
        }
    }

    pub fn record_usage(&mut self, usage: &codra_protocol::TokenUsage) {
        self.total_prompt_tokens += usage.prompt_tokens;
        self.total_completion_tokens += usage.completion_tokens;
        self.total_cost_usd += (usage.prompt_tokens as f64 / 1000.0) * self.cost_per_1k_prompt;
        self.total_cost_usd +=
            (usage.completion_tokens as f64 / 1000.0) * self.cost_per_1k_completion;
    }

    pub fn summary(&self) -> CostSummary {
        CostSummary {
            total_prompt_tokens: self.total_prompt_tokens,
            total_completion_tokens: self.total_completion_tokens,
            total_tokens: self.total_prompt_tokens + self.total_completion_tokens,
            total_cost_usd: (self.total_cost_usd * 100.0).round() / 100.0,
        }
    }

    pub fn reset(&mut self) {
        self.total_prompt_tokens = 0;
        self.total_completion_tokens = 0;
        self.total_cost_usd = 0.0;
    }
}

impl Default for CostTracker {
    fn default() -> Self {
        Self::new(0.0, 0.0)
    }
}

#[derive(Debug, Clone)]
pub struct CostSummary {
    pub total_prompt_tokens: i64,
    pub total_completion_tokens: i64,
    pub total_tokens: i64,
    pub total_cost_usd: f64,
}

pub struct TurnMetrics {
    pub turn_number: usize,
    pub token_usage: codra_protocol::TokenUsage,
    pub tool_calls: usize,
    pub duration_ms: u128,
    pub cost: CostSummary,
}
