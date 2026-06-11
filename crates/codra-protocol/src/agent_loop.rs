use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentLoopState {
    Start,
    CallModel,
    CheckApiResponse,
    AccumulateStream,
    ClassifyFinishReason,
    ValidateToolCall,
    ExecuteTool,
    AppendObservation,
    CheckpointIfNeeded,
    RebuildContextIfNeeded,
    ClassifyContent,
    GoalVerify,
    Final,
    ThinkOnly,
    ApiError,
    Truncated,
    Filtered,
    Failed,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentFinishReason {
    ToolCalls,
    FunctionCall,
    Length,
    ContentFilter,
    Stop,
    ApiError,
    StreamingNull,
    Unknown,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentApiResponseStatus {
    Ok,
    Streaming,
    ApiError,
    ParseError,
    Incomplete,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentContentClassification {
    FinalAnswer,
    ThinkOnly,
    Empty,
    Question,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentApiErrorClass {
    RateLimited,
    ServerError,
    Timeout,
    AuthError,
    ClientError,
    ParseError,
    Unknown,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentGoalVerdict {
    Complete,
    Incomplete,
    Impossible,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AgentLoopEventType {
    LoopStarted,
    ModelCallDispatched,
    ApiResponseOk,
    ApiResponseStreaming,
    ApiResponseError,
    StreamComplete,
    StreamError,
    StreamNullStall,
    FinishClassified,
    ToolValid,
    ToolInvalid,
    ToolExecuted,
    ObservationAppended,
    CheckpointDone,
    RebuildNotNeeded,
    RebuildDone,
    ContentClassified,
    GoalComplete,
    GoalIncomplete,
    GoalImpossible,
    NoGoalSet,
    NudgeSent,
    NudgeExhausted,
    RetryAllowed,
    RetryExhausted,
    TruncationRecoverySelected,
    TruncationTerminal,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AgentLoopTransition {
    pub from: AgentLoopState,
    pub to: AgentLoopState,
    pub event: AgentLoopEventType,
    pub reason: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AgentLoopDecision {
    pub next_state: AgentLoopState,
    pub reason: String,
    pub finish_reason: Option<AgentFinishReason>,
    pub content_classification: Option<AgentContentClassification>,
    pub terminal: Option<bool>,
    pub retryable: Option<bool>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn agent_loop_state_serializes_snake_case() {
        let state = AgentLoopState::ValidateToolCall;
        let json = serde_json::to_string(&state).expect("serialize state");
        assert_eq!(json, "\"validate_tool_call\"");
    }

    #[test]
    fn agent_finish_reason_serializes_snake_case() {
        let reason = AgentFinishReason::StreamingNull;
        let json = serde_json::to_string(&reason).expect("serialize finish reason");
        assert_eq!(json, "\"streaming_null\"");
    }

    #[test]
    fn agent_loop_decision_round_trips() {
        let decision = AgentLoopDecision {
            next_state: AgentLoopState::GoalVerify,
            reason: "goal required".to_string(),
            finish_reason: Some(AgentFinishReason::Stop),
            content_classification: Some(AgentContentClassification::FinalAnswer),
            terminal: Some(false),
            retryable: None,
        };

        let json = serde_json::to_string(&decision).expect("serialize decision");
        let parsed: AgentLoopDecision = serde_json::from_str(&json).expect("parse decision");
        assert_eq!(parsed.next_state, AgentLoopState::GoalVerify);
        assert_eq!(parsed.finish_reason, Some(AgentFinishReason::Stop));
    }
}