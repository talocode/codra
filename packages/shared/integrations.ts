import type { WorkspaceSummary } from "./core";
import type { ExecutionState, PatchProposal } from "./executor";
import type { ExecutionPlan } from "./planner";
import type { ProviderConfig } from "./provider";
import type { RuntimeMode, SafetyMode, TimelineEvent } from "./runtime";

export type RepairAttemptStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "applied"
  | "verifying"
  | "failed"
  | "exhausted"
  | "completed";

export type DeployTargetKind =
  | "node_web_app"
  | "static_site"
  | "tauri_desktop"
  | "rust_service"
  | "unknown";

export type BrowserSessionStatus =
  | "idle"
  | "launching"
  | "connecting"
  | "ready"
  | "navigating"
  | "busy"
  | "disconnected"
  | "failed"
  | "closed";

export type BrowserActionKind =
  | "open_url"
  | "click_selector"
  | "type_selector"
  | "wait_for_selector"
  | "extract_text"
  | "capture_screenshot"
  | "get_page_state";

export type BrowserArtifactKind =
  | "screenshot"
  | "page_snapshot"
  | "event_log"
  | "extracted_text";

export interface BrowserTargetInfo {
  url: string;
  title: string;
}

export interface BrowserPageState {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface BrowserActionRequest {
  id: string;
  kind: BrowserActionKind;
  value: string;
  textInput?: string;
}

export interface BrowserActionResult {
  actionId: string;
  success: boolean;
  message: string;
  artifactPath?: string;
  screenshotBase64?: string;
}

export interface BrowserEventLogEntry {
  timestamp: string;
  actionId: string;
  kind: BrowserActionKind;
  success: boolean;
  message: string;
}

export interface BrowserArtifact {
  id: string;
  kind: BrowserArtifactKind;
  path: string;
  timestamp: string;
  metadata?: any;
}

export interface BrowserSessionState {
  status: BrowserSessionStatus;
  currentTarget?: BrowserTargetInfo;
  lastError?: string;
  artifacts?: BrowserArtifact[];
  eventLog?: BrowserEventLogEntry[];
}

export interface RepairAttempt {
  id: string;
  verificationId: string;
  status: RepairAttemptStatus;
  proposedPatch?: PatchProposal;
  error?: string;
  attemptNumber: number;
}

export interface DeployPrepSummary {
  id: string;
  targetKind: DeployTargetKind;
  detectedRoots: string[];
  proposedCommands: string[];
  risks: string[];
}

export interface AppBootData {
  lastWorkspace?: WorkspaceSummary;
  activePlan?: ExecutionPlan;
  activeExecution?: ExecutionState;
  providerConfig?: ProviderConfig;
  timeline?: TimelineEvent[];
  safetyMode?: SafetyMode;
  runtimeMode?: RuntimeMode;
  recoveredFromLegacy: boolean;
}
