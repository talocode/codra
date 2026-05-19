import type { ApprovalRequirement } from "./core";
import type { RuntimeMode, TimelineEvent } from "./runtime";

export type ProviderKind =
  | "ollama"
  | "openai_compatible"
  | "open_ai"
  | "anthropic"
  | "gemini"
  | "bedrock"
  | "vertex"
  | "mock";

export type ProviderStatus =
  | "unconfigured"
  | "connecting"
  | "connected"
  | "failed"
  | "degraded";

export type GenerationMode =
  | "plan_generation"
  | "architecture_generation"
  | "step_refinement"
  | "patch_rationale"
  | "verification_analysis"
  | "repair_generation"
  | "deploy_prep_reasoning";

export interface ProviderConfig {
  kind: ProviderKind;
  baseUrl: string;
  modelId: string;
  apiKeySet: boolean;
  profileId?: string;
  profileName?: string;
}

export interface ProviderHealthResult {
  reachable: boolean;
  modelAvailable: boolean;
  status: ProviderStatus;
  message: string;
}

export interface ModelDescriptor {
  id: string;
  name: string;
  contextLength?: number;
  supportsTools?: boolean;
  supportsVision?: boolean;
}

export interface GenerationRequest {
  mode: GenerationMode;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerationResponse {
  content: string;
  finishReason?: string;
  tokenUsage?: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ProviderProfile {
  id: string;
  name: string;
  config: ProviderConfig;
  runtimeMode: RuntimeMode;
  routePlannerModel?: string;
  routeExecutorModel?: string;
  routeVerifierModel?: string;
  routeResearchModel?: string;
}

export type ToolCategory =
  | "filesystem"
  | "search"
  | "terminal"
  | "git"
  | "planner"
  | "verifier"
  | "browser"
  | "computer_use"
  | "web_research"
  | "design"
  | "deploy"
  | "task";

export type ToolSafetyLevel =
  | "read_only"
  | "workspace_write"
  | "destructive"
  | "external_network"
  | "computer_control";

export interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  safetyLevel: ToolSafetyLevel;
  inputSchema: unknown;
}

export interface ToolCallRequest {
  id: string;
  toolName: string;
  arguments: unknown;
}

export interface ToolCallResult {
  id: string;
  toolName: string;
  success: boolean;
  output: unknown;
  approvalRequired?: ApprovalRequirement;
  timelineEvent?: TimelineEvent;
}

export interface McpServerInfo {
  name: string;
  version: string;
  tools: ToolDefinition[];
}

export interface SkillDescriptor {
  name: string;
  path: string;
  description: string;
  enabled: boolean;
}
