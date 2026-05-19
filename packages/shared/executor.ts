export type ExecutionStatus =
  | "pending"
  | "ready"
  | "running"
  | "waiting_for_approval"
  | "paused"
  | "blocked"
  | "failed"
  | "completed"
  | "cancelled";

export type ExecutionMode = "step_by_step" | "autonomous";
export type StepExecutionStatus =
  | "not_started"
  | "context_ready"
  | "action_selected"
  | "running"
  | "awaiting_patch_review"
  | "awaiting_approval"
  | "applied"
  | "verified"
  | "failed"
  | "skipped";

export type ActionKind =
  | "inspect_files"
  | "search_repo"
  | "read_file"
  | "propose_edit"
  | "apply_edit"
  | "run_command"
  | "update_docs"
  | "git_review"
  | "prepare_verify";

export type PatchProposalStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "rejected"
  | "applied"
  | "superseded";

export interface ExecutionState {
  id: string;
  planId: string;
  status: ExecutionStatus;
  mode: ExecutionMode;
  currentStepId?: string;
}

export interface ObservationRecord {
  timestamp: string;
  message: string;
}

export interface PatchProposal {
  id: string;
  stepId: string;
  targetFile: string;
  rationale: string;
  diffContent: string;
  status: PatchProposalStatus;
  timestamp: string;
}

export interface StepExecutionRecord {
  stepId: string;
  status: StepExecutionStatus;
  observations: ObservationRecord[];
  pendingPatch?: PatchProposal;
}

export interface ActionIntent {
  kind: ActionKind;
  target: string;
  reason: string;
}
