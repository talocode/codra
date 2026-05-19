export type VerificationStatus =
  | "pending"
  | "ready"
  | "running"
  | "passed"
  | "failed"
  | "inconclusive"
  | "blocked"
  | "cancelled";

export type VerificationCheckKind =
  | "test_command"
  | "lint_command"
  | "typecheck_command"
  | "build_command"
  | "formatting_check"
  | "custom_command";

export type VerificationSeverity = "low" | "medium" | "critical" | "fatal";
export type FailureClassification =
  | "test_failure"
  | "lint_failure"
  | "type_error"
  | "build_error"
  | "missing_dependency"
  | "environment_issue"
  | "command_failure"
  | "timeout"
  | "unknown";

export interface VerificationCheck {
  id: string;
  kind: VerificationCheckKind;
  command: string;
  args: string[];
}

export interface VerificationFinding {
  id: string;
  severity: VerificationSeverity;
  classification: FailureClassification;
  message: string;
  affectedFiles: string[];
}

export interface RetryRecommendation {
  reason: string;
  affectedFiles: string[];
  suggestedAction: string;
  allowAutoExecution: boolean;
}

export interface RetryRequest {
  id: string;
  verificationId: string;
  executionId: string;
  stepId: string;
  failureSummary: string;
  findings: VerificationFinding[];
  suggestedScope: string;
}

export interface VerificationState {
  id: string;
  executionId: string;
  stepId: string;
  status: VerificationStatus;
  checksConfigured: VerificationCheck[];
  findings: VerificationFinding[];
  retryRecommendation?: RetryRecommendation;
  stdout: string;
}
