export type SafetyMode = "read_only" | "workspace_write" | "danger_full_access";

export type RuntimeMode =
  | "balanced"
  | "local_only"
  | "cloud_assisted"
  | "research_heavy"
  | "browser_heavy";

export type TimelineSource =
  | "system"
  | "planner"
  | "executor"
  | "verifier"
  | "repair"
  | "provider"
  | "tool"
  | "browser"
  | "computer_use"
  | "research"
  | "deploy"
  | "design";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  source: TimelineSource;
  title: string;
  message: string;
  status: string;
}

export type ComputerUseActionKind =
  | "list_apps"
  | "get_app_state"
  | "press_key"
  | "type_text"
  | "click_target"
  | "run_sequence";

export interface ComputerUseAction {
  id: string;
  kind: ComputerUseActionKind;
  target?: string;
  text?: string;
  sequence: ComputerUseAction[];
  requiresPermission: boolean;
}

export interface ComputerUseResult {
  actionId: string;
  success: boolean;
  message: string;
  state?: unknown;
}

export interface WebResearchRecord {
  id: string;
  query: string;
  title: string;
  url: string;
  summary: string;
  markedRelevant: boolean;
  timestamp: string;
}

export interface DesignToken {
  name: string;
  value: string;
  category: string;
  description?: string;
}

export interface DesignSystemSummary {
  found: boolean;
  path?: string;
  tokens: DesignToken[];
  rationale: string;
  issues: string[];
}
