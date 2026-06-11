import type {
  AgentApiErrorClass,
  AgentContentClassification,
  AgentFinishReason,
  AgentLoopDecision,
  AgentLoopEvent,
  AgentLoopState,
  AgentRetryPolicy,
  ClassifyContentInput,
  ClassifyFinishReasonInput,
} from "./agent-loop";
import { DEFAULT_AGENT_RETRY_POLICY, TERMINAL_AGENT_LOOP_STATES } from "./agent-loop";

const THINK_ONLY_PATTERNS = [
  /^let me think\b/i,
  /^i should\b/i,
  /^i need to\b/i,
  /^i'll\b/i,
  /^i will\b/i,
  /^thinking\b/i,
  /^hmm\b/i,
  /^okay,?\s+i\b/i,
];

const PROVIDER_FINISH_REASON_MAP: Record<string, AgentFinishReason> = {
  tool_calls: "tool_calls",
  function_call: "function_call",
  length: "length",
  content_filter: "content_filter",
  stop: "stop",
};

function normalizeFinishReason(value?: string | null): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

function hasToolCalls(toolCalls: ClassifyFinishReasonInput["toolCalls"]): boolean {
  return (toolCalls?.length ?? 0) > 0;
}

function hasSubstantiveContent(content?: string): boolean {
  return Boolean(content && content.trim().length > 0);
}

export function classifyFinishReason(input: ClassifyFinishReasonInput): AgentFinishReason {
  const normalized = normalizeFinishReason(input.finishReason);

  if (normalized === "api_error") {
    return "api_error";
  }

  if (normalized && PROVIDER_FINISH_REASON_MAP[normalized]) {
    return PROVIDER_FINISH_REASON_MAP[normalized];
  }

  if (input.receivedNullChunksOnly && input.isStreaming) {
    return "streaming_null";
  }

  if (!normalized) {
    if (hasToolCalls(input.toolCalls)) {
      return "tool_calls";
    }
    if (hasSubstantiveContent(input.content)) {
      return "stop";
    }
    if (input.isStreaming) {
      return "streaming_null";
    }
    return "unknown";
  }

  return "unknown";
}

export function classifyContent(input: ClassifyContentInput): AgentContentClassification {
  const content = input.content.trim();

  if (!content) {
    return "empty";
  }

  if (content.endsWith("?") || /^(can you|could you|should i|do you want)\b/i.test(content)) {
    return "question";
  }

  if (!input.hadToolCallsInTurn && THINK_ONLY_PATTERNS.some((pattern) => pattern.test(content))) {
    const looksLikeDeliverable =
      /```/.test(content) ||
      /\b(done|completed|implemented|fixed|created|updated|here is|here's)\b/i.test(content);

    if (!looksLikeDeliverable) {
      return "think_only";
    }
  }

  return "final_answer";
}

export function shouldRetryApiError(
  error: AgentApiErrorClass,
  attempt: number,
  policy: AgentRetryPolicy = DEFAULT_AGENT_RETRY_POLICY,
): boolean {
  if (attempt >= policy.maxAttempts) {
    return false;
  }

  return policy.retriableErrors.includes(error);
}

export function finishReasonToNextState(finishReason: AgentFinishReason): AgentLoopState {
  switch (finishReason) {
    case "tool_calls":
    case "function_call":
      return "validate_tool_call";
    case "length":
      return "truncated";
    case "content_filter":
      return "filtered";
    case "stop":
      return "classify_content";
    case "api_error":
    case "streaming_null":
    case "unknown":
      return "api_error";
    default:
      return "api_error";
  }
}

export function contentClassificationToNextState(
  classification: AgentContentClassification,
  hasGoal: boolean,
): AgentLoopState {
  switch (classification) {
    case "final_answer":
      return hasGoal ? "goal_verify" : "final";
    case "think_only":
    case "empty":
    case "question":
      return "think_only";
    default:
      return "think_only";
  }
}

export function nextAgentLoopState(
  currentState: AgentLoopState,
  event: AgentLoopEvent,
): AgentLoopDecision {
  switch (currentState) {
    case "start":
      if (event.type === "loop_started") {
        return { nextState: "call_model", reason: "initialize agent loop turn batch" };
      }
      break;

    case "call_model":
      if (event.type === "model_call_dispatched") {
        return { nextState: "check_api_response", reason: "await provider response" };
      }
      break;

    case "check_api_response":
      if (event.type === "api_response_ok") {
        return { nextState: "classify_finish_reason", reason: "parse successful response" };
      }
      if (event.type === "api_response_streaming") {
        return { nextState: "accumulate_stream", reason: "begin stream accumulation" };
      }
      if (event.type === "api_response_error") {
        return {
          nextState: "api_error",
          reason: "provider transport or HTTP failure",
          retryable: true,
        };
      }
      break;

    case "accumulate_stream":
      if (event.type === "stream_complete") {
        return { nextState: "classify_finish_reason", reason: "stream finished" };
      }
      if (event.type === "stream_error" || event.type === "stream_null_stall") {
        return {
          nextState: "api_error",
          reason: "stream failed or stalled on null chunks",
          retryable: true,
        };
      }
      break;

    case "classify_finish_reason":
      if (event.type === "finish_classified" && event.finishReason) {
        const nextState = finishReasonToNextState(event.finishReason);
        return {
          nextState,
          reason: `route ${event.finishReason} finish reason`,
          finishReason: event.finishReason,
        };
      }
      break;

    case "validate_tool_call":
      if (event.type === "tool_valid") {
        return { nextState: "execute_tool", reason: "tool call passed validation" };
      }
      if (event.type === "tool_invalid") {
        return {
          nextState: "append_observation",
          reason: "append validation error observation",
        };
      }
      break;

    case "execute_tool":
      if (event.type === "tool_executed") {
        return { nextState: "append_observation", reason: "append tool result observation" };
      }
      break;

    case "append_observation":
      if (event.type === "observation_appended") {
        return { nextState: "checkpoint_if_needed", reason: "evaluate checkpoint threshold" };
      }
      break;

    case "checkpoint_if_needed":
      if (event.type === "checkpoint_done") {
        return { nextState: "rebuild_context_if_needed", reason: "checkpoint handled" };
      }
      break;

    case "rebuild_context_if_needed":
      if (event.type === "rebuild_not_needed" || event.type === "rebuild_done") {
        return { nextState: "call_model", reason: "continue loop with refreshed context" };
      }
      break;

    case "truncated":
      if (event.type === "truncation_recovery_selected") {
        return { nextState: "checkpoint_if_needed", reason: "recover from truncation" };
      }
      if (event.type === "truncation_terminal") {
        return {
          nextState: "truncated",
          reason: "truncation treated as terminal",
          terminal: true,
        };
      }
      break;

    case "filtered":
      return {
        nextState: "filtered",
        reason: "content filter is terminal unless explicit recovery is added later",
        terminal: true,
      };

    case "classify_content":
      if (event.type === "content_classified" && event.contentClassification) {
        const nextState = contentClassificationToNextState(
          event.contentClassification,
          Boolean(event.hasGoal),
        );
        return {
          nextState,
          reason: `content classified as ${event.contentClassification}`,
          contentClassification: event.contentClassification,
        };
      }
      break;

    case "goal_verify":
      if (event.type === "goal_complete") {
        return { nextState: "final", reason: "goal satisfied" };
      }
      if (event.type === "goal_incomplete") {
        return { nextState: "call_model", reason: "goal not yet satisfied" };
      }
      if (event.type === "goal_impossible") {
        return { nextState: "failed", reason: "goal marked impossible", terminal: true };
      }
      if (event.type === "no_goal_set") {
        return { nextState: "final", reason: "no goal configured" };
      }
      break;

    case "think_only":
      if (event.type === "nudge_sent") {
        return { nextState: "call_model", reason: "nudge model to continue" };
      }
      if (event.type === "nudge_exhausted") {
        return { nextState: "failed", reason: "think-only loop exhausted", terminal: true };
      }
      break;

    case "api_error":
      if (event.type === "retry_allowed") {
        return { nextState: "call_model", reason: "retry provider call", retryable: true };
      }
      if (event.type === "retry_exhausted") {
        return { nextState: "failed", reason: "retry budget exhausted", terminal: true };
      }
      break;

    case "final":
    case "failed":
      return {
        nextState: currentState,
        reason: "terminal state",
        terminal: true,
      };
  }

  return {
    nextState: "failed",
    reason: `unsupported transition from ${currentState} on ${event.type}`,
    terminal: true,
  };
}

export function isTerminalAgentLoopState(
  state: AgentLoopState,
  options?: { allowTruncatedRecovery?: boolean },
): boolean {
  if (TERMINAL_AGENT_LOOP_STATES.has(state)) {
    return true;
  }

  if (state === "truncated") {
    return !options?.allowTruncatedRecovery;
  }

  return false;
}

export function classifyApiErrorFromStatus(statusCode?: number): AgentApiErrorClass {
  if (!statusCode) {
    return "unknown";
  }
  if (statusCode === 429) {
    return "rate_limited";
  }
  if (statusCode === 401 || statusCode === 403) {
    return "auth_error";
  }
  if (statusCode >= 500) {
    return "server_error";
  }
  if (statusCode >= 400) {
    return "client_error";
  }
  return "unknown";
}