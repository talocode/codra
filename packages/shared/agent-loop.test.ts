import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyApiErrorFromStatus,
  classifyContent,
  classifyFinishReason,
  contentClassificationToNextState,
  finishReasonToNextState,
  isTerminalAgentLoopState,
  nextAgentLoopState,
  shouldRetryApiError,
} from "./agent-loop-classifier";

describe("classifyFinishReason", () => {
  const cases: Array<{
    name: string;
    input: Parameters<typeof classifyFinishReason>[0];
    expected: ReturnType<typeof classifyFinishReason>;
  }> = [
    {
      name: "tool_calls",
      input: { finishReason: "tool_calls", content: "", toolCalls: [{ name: "read_file", arguments: "{}" }] },
      expected: "tool_calls",
    },
    {
      name: "function_call",
      input: { finishReason: "function_call", content: "", toolCalls: [{ name: "grep", arguments: "{}" }] },
      expected: "function_call",
    },
    {
      name: "length",
      input: { finishReason: "length", content: "partial" },
      expected: "length",
    },
    {
      name: "content_filter",
      input: { finishReason: "content_filter", content: "" },
      expected: "content_filter",
    },
    {
      name: "stop",
      input: { finishReason: "stop", content: "Done." },
      expected: "stop",
    },
    {
      name: "api_error",
      input: { finishReason: "api_error", content: "" },
      expected: "api_error",
    },
    {
      name: "streaming_null",
      input: { finishReason: null, isStreaming: true, receivedNullChunksOnly: true },
      expected: "streaming_null",
    },
    {
      name: "null finish with tool calls",
      input: {
        finishReason: null,
        toolCalls: [{ name: "list_dir", arguments: "{}" }],
      },
      expected: "tool_calls",
    },
    {
      name: "null finish with content",
      input: { finishReason: null, content: "Continuing." },
      expected: "stop",
    },
    {
      name: "unknown finish reason",
      input: { finishReason: "weird_provider_reason", content: "" },
      expected: "unknown",
    },
  ];

  for (const testCase of cases) {
    it(testCase.name, () => {
      assert.equal(classifyFinishReason(testCase.input), testCase.expected);
    });
  }
});

describe("finishReasonToNextState", () => {
  it("routes tool calls to validation", () => {
    assert.equal(finishReasonToNextState("tool_calls"), "validate_tool_call");
    assert.equal(finishReasonToNextState("function_call"), "validate_tool_call");
  });

  it("routes length to truncated", () => {
    assert.equal(finishReasonToNextState("length"), "truncated");
  });

  it("routes content filter to filtered", () => {
    assert.equal(finishReasonToNextState("content_filter"), "filtered");
  });

  it("routes stop to content classification", () => {
    assert.equal(finishReasonToNextState("stop"), "classify_content");
  });

  it("routes unknown and api errors to api_error", () => {
    assert.equal(finishReasonToNextState("api_error"), "api_error");
    assert.equal(finishReasonToNextState("streaming_null"), "api_error");
    assert.equal(finishReasonToNextState("unknown"), "api_error");
  });
});

describe("classifyContent", () => {
  it("classifies substantive stop content as final answer", () => {
    assert.equal(
      classifyContent({
        content: "Implemented the finish reason classifier and added tests.",
      }),
      "final_answer",
    );
  });

  it("classifies think-only stop content", () => {
    assert.equal(
      classifyContent({
        content: "Let me think about how to structure the state machine.",
      }),
      "think_only",
    );
  });

  it("classifies empty content", () => {
    assert.equal(classifyContent({ content: "   " }), "empty");
  });

  it("classifies questions", () => {
    assert.equal(classifyContent({ content: "Should I update the tests too?" }), "question");
  });
});

describe("contentClassificationToNextState", () => {
  it("routes final answer to goal verify when goal exists", () => {
    assert.equal(contentClassificationToNextState("final_answer", true), "goal_verify");
  });

  it("routes final answer to final when no goal exists", () => {
    assert.equal(contentClassificationToNextState("final_answer", false), "final");
  });

  it("routes think-only to nudge state", () => {
    assert.equal(contentClassificationToNextState("think_only", true), "think_only");
  });
});

describe("shouldRetryApiError", () => {
  it("allows retry for retriable errors under budget", () => {
    assert.equal(shouldRetryApiError("rate_limited", 1), true);
    assert.equal(shouldRetryApiError("server_error", 2), true);
    assert.equal(shouldRetryApiError("timeout", 1), true);
  });

  it("rejects retry when budget is exhausted", () => {
    assert.equal(shouldRetryApiError("rate_limited", 3), false);
    assert.equal(shouldRetryApiError("server_error", 4), false);
  });

  it("rejects retry for non-retriable errors", () => {
    assert.equal(shouldRetryApiError("auth_error", 1), false);
    assert.equal(shouldRetryApiError("client_error", 1), false);
  });
});

describe("nextAgentLoopState", () => {
  it("starts the loop at call_model", () => {
    const decision = nextAgentLoopState("start", { type: "loop_started" });
    assert.equal(decision.nextState, "call_model");
  });

  it("routes validated tool calls to execution", () => {
    const decision = nextAgentLoopState("validate_tool_call", { type: "tool_valid" });
    assert.equal(decision.nextState, "execute_tool");
  });

  it("routes invalid tool calls to observation append", () => {
    const decision = nextAgentLoopState("validate_tool_call", { type: "tool_invalid" });
    assert.equal(decision.nextState, "append_observation");
  });

  it("routes stop classification to goal verify when goal exists", () => {
    const decision = nextAgentLoopState("classify_content", {
      type: "content_classified",
      contentClassification: "final_answer",
      hasGoal: true,
    });
    assert.equal(decision.nextState, "goal_verify");
  });

  it("routes stop classification to final when no goal exists", () => {
    const decision = nextAgentLoopState("classify_content", {
      type: "content_classified",
      contentClassification: "final_answer",
      hasGoal: false,
    });
    assert.equal(decision.nextState, "final");
  });

  it("routes think-only classification to think_only", () => {
    const decision = nextAgentLoopState("classify_content", {
      type: "content_classified",
      contentClassification: "think_only",
      hasGoal: true,
    });
    assert.equal(decision.nextState, "think_only");
  });

  it("routes api_error retry exhaustion to failed", () => {
    const decision = nextAgentLoopState("api_error", { type: "retry_exhausted" });
    assert.equal(decision.nextState, "failed");
    assert.equal(decision.terminal, true);
  });

  it("routes api_error retry allowance back to call_model", () => {
    const decision = nextAgentLoopState("api_error", { type: "retry_allowed" });
    assert.equal(decision.nextState, "call_model");
  });

  it("routes finish_classified tool_calls to validate_tool_call", () => {
    const decision = nextAgentLoopState("classify_finish_reason", {
      type: "finish_classified",
      finishReason: "tool_calls",
    });
    assert.equal(decision.nextState, "validate_tool_call");
  });

  it("fails safely on unknown transitions", () => {
    const decision = nextAgentLoopState("call_model", { type: "loop_started" });
    assert.equal(decision.nextState, "failed");
    assert.equal(decision.terminal, true);
  });

  it("keeps terminal states stable on unexpected events", () => {
    const decision = nextAgentLoopState("final", { type: "loop_started" });
    assert.equal(decision.nextState, "final");
    assert.equal(decision.terminal, true);
  });
});

describe("isTerminalAgentLoopState", () => {
  it("detects terminal states", () => {
    assert.equal(isTerminalAgentLoopState("final"), true);
    assert.equal(isTerminalAgentLoopState("failed"), true);
    assert.equal(isTerminalAgentLoopState("filtered"), true);
  });

  it("treats truncated as terminal by default", () => {
    assert.equal(isTerminalAgentLoopState("truncated"), true);
  });

  it("allows truncated recovery when explicitly selected", () => {
    assert.equal(isTerminalAgentLoopState("truncated", { allowTruncatedRecovery: true }), false);
  });

  it("detects non-terminal work states", () => {
    assert.equal(isTerminalAgentLoopState("call_model"), false);
    assert.equal(isTerminalAgentLoopState("validate_tool_call"), false);
    assert.equal(isTerminalAgentLoopState("think_only"), false);
  });
});

describe("classifyApiErrorFromStatus", () => {
  it("maps HTTP status codes to error classes", () => {
    assert.equal(classifyApiErrorFromStatus(429), "rate_limited");
    assert.equal(classifyApiErrorFromStatus(503), "server_error");
    assert.equal(classifyApiErrorFromStatus(401), "auth_error");
    assert.equal(classifyApiErrorFromStatus(404), "client_error");
  });
});