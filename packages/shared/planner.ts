export type PlanStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "superseded"
  | "archived";

export type PlanningMode = "auto" | "interactive";
export type PlanStepStatus = "pending" | "running" | "completed" | "failed";
export type PlanStepKind =
  | "inspect"
  | "search"
  | "edit"
  | "run_command"
  | "verify"
  | "git_review"
  | "browser_task"
  | "deploy_prep"
  | "doc_update"
  | "manual_input";

export interface TaskRequest {
  id: string;
  intent: string;
  mode: PlanningMode;
}

export interface TaskContext {
  workspaceId: string;
  workspacePath: string;
  intent: string;
  recentSearches: string[];
  recentFiles: string[];
}

export interface RiskItem {
  description: string;
  severity: "low" | "medium" | "high";
}

export interface AssumptionItem {
  description: string;
  confidence: "low" | "medium" | "high";
}

export interface PlanDependency {
  stepId: string;
  dependsOn: string;
}

export interface PlanStep {
  id: string;
  kind: PlanStepKind;
  title: string;
  objective: string;
  status: PlanStepStatus;
  filesLikelyInvolved: string[];
  requiredTools: string[];
}

export interface ArchitectureProposal {
  id: string;
  rationale: string;
  successCriteria: string[];
  estimatedImpact: string;
  tradeoffs: string[];
  touchedSubsystems: string[];
}

export interface ExecutionPlan {
  id: string;
  taskId: string;
  status: PlanStatus;
  title: string;
  objective: string;
  steps: PlanStep[];
  dependencies: PlanDependency[];
  assumptions: AssumptionItem[];
  risks: RiskItem[];
  architectureProposal?: ArchitectureProposal;
}

export interface PlannerOutput {
  plan: ExecutionPlan;
}

export interface PlannerDecision {
  requiresArchitecture: boolean;
  reason: string;
}
