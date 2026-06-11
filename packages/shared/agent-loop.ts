export type AgentLoopState =
  | "start"
  | "call_model"
  | "check_api_response"
  | "accumulate_stream"
  | "classify_finish_reason"
  | "validate_tool_call"
  | "execute_tool"
  | "append_observation"
  | "checkpoint_if_needed"
  | "rebuild_context_if_needed"
  | "classify_content"
  | "goal_verify"
  | "final"
  | "think_only"
  | "api_error"
  | "truncated"
  | "filtered"
  | "failed";

export type AgentFinishReason =
  | "tool_calls"
  | "function_call"
  | "length"
  | "content_filter"
  | "stop"
  | "api_error"
  | "streaming_null"
  | "unknown";

export type AgentApiResponseStatus =
  | "ok"
  | "streaming"
  | "api_error"
  | "parse_error"
  | "incomplete";

export type AgentContentClassification =
  | "final_answer"
  | "think_only"
  | "empty"
  | "question";

export type AgentApiErrorClass =
  | "rate_limited"
  | "server_error"
  | "timeout"
  | "auth_error"
  | "client_error"
  | "parse_error"
  | "unknown";

export type AgentGoalVerdict = "complete" | "incomplete" | "impossible";

export interface AgentToolCallPayload {
  id?: string;
  name: string;
  arguments: string | Record<string, unknown>;
}

export interface AgentRetryPolicy {
  maxAttempts: number;
  retriableErrors: AgentApiErrorClass[];
}

export interface ClassifyFinishReasonInput {
  finishReason?: string | null;
  content?: string;
  toolCalls?: AgentToolCallPayload[];
  isStreaming?: boolean;
  receivedNullChunksOnly?: boolean;
}

export interface ClassifyContentInput {
  content: string;
  hadToolCallsInTurn?: boolean;
}

export type AgentLoopEventType =
  | "loop_started"
  | "model_call_dispatched"
  | "api_response_ok"
  | "api_response_streaming"
  | "api_response_error"
  | "stream_complete"
  | "stream_error"
  | "stream_null_stall"
  | "finish_classified"
  | "tool_valid"
  | "tool_invalid"
  | "tool_executed"
  | "observation_appended"
  | "checkpoint_done"
  | "rebuild_not_needed"
  | "rebuild_done"
  | "content_classified"
  | "goal_complete"
  | "goal_incomplete"
  | "goal_impossible"
  | "no_goal_set"
  | "nudge_sent"
  | "nudge_exhausted"
  | "retry_allowed"
  | "retry_exhausted"
  | "truncation_recovery_selected"
  | "truncation_terminal";

export interface AgentLoopTransition {
  from: AgentLoopState;
  to: AgentLoopState;
  event: AgentLoopEventType;
  reason?: string;
}

export interface AgentLoopDecision {
  nextState: AgentLoopState;
  reason: string;
  finishReason?: AgentFinishReason;
  contentClassification?: AgentContentClassification;
  terminal?: boolean;
  retryable?: boolean;
}

export interface AgentLoopEvent {
  type: AgentLoopEventType;
  finishReason?: AgentFinishReason;
  contentClassification?: AgentContentClassification;
  hasGoal?: boolean;
}

export const DEFAULT_AGENT_RETRY_POLICY: AgentRetryPolicy = {
  maxAttempts: 3,
  retriableErrors: ["rate_limited", "server_error", "timeout"],
};

export const TERMINAL_AGENT_LOOP_STATES: ReadonlySet<AgentLoopState> = new Set([
  "final",
  "failed",
  "filtered",
]);