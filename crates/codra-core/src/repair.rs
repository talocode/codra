use crate::provider::IntelligenceProvider;
use chrono::Utc;
use codra_protocol::{
    GenerationMode, GenerationRequest, PatchProposal, PatchProposalStatus, RepairAttempt,
    RepairAttemptStatus, RetryRequest,
};
use uuid::Uuid;

pub struct RepairService<'a> {
    workspace_root: String,
    provider: &'a dyn IntelligenceProvider,
    max_retries: i32,
    attempt_history: Vec<RepairAttempt>,
}

impl<'a> RepairService<'a> {
    pub fn new(workspace_root: &str, provider: &'a dyn IntelligenceProvider) -> Self {
        Self {
            workspace_root: workspace_root.to_string(),
            provider,
            max_retries: 3,
            attempt_history: vec![],
        }
    }

    pub fn with_max_retries(mut self, max: i32) -> Self {
        self.max_retries = max;
        self
    }

    pub fn attempt_count(&self) -> i32 {
        self.attempt_history.len() as i32
    }

    pub fn budget_exhausted(&self) -> bool {
        self.attempt_history.len() as i32 >= self.max_retries
    }

    pub fn construct_repair_attempt(
        &mut self,
        retry_request: &RetryRequest,
    ) -> Result<RepairAttempt, String> {
        let attempt_number = self.attempt_history.len() as i32 + 1;

        if attempt_number > self.max_retries {
            return Err(format!(
                "Repair budget exhausted: {} attempts used out of {}",
                self.attempt_history.len(),
                self.max_retries
            ));
        }

        let context = self.build_repair_context(retry_request, attempt_number);

        let request = GenerationRequest {
            mode: GenerationMode::RepairGeneration,
            system_prompt: crate::prompts::REPAIR_SYSTEM_PROMPT.to_string(),
            user_prompt: context,
            max_tokens: Some(2048),
            temperature: Some(0.2),
        };

        let diff_content = match self.provider.generate(&request) {
            Ok(response) => response.content,
            Err(e) => {
                format!(
                    "// Provider repair generation failed: {}\n// Manual intervention required",
                    e
                )
            }
        };

        let target_file = retry_request
            .findings
            .first()
            .and_then(|f| f.affected_files.first().cloned())
            .unwrap_or_else(|| "src/main.rs".to_string());

        let patch = PatchProposal {
            id: Uuid::new_v4().to_string(),
            step_id: retry_request.step_id.clone(),
            target_file,
            rationale: format!(
                "Attempt {}/{}: {}",
                attempt_number, self.max_retries, retry_request.suggested_scope
            ),
            diff_content,
            status: PatchProposalStatus::ReadyForReview,
            timestamp: Utc::now().to_rfc3339(),
        };

        let attempt = RepairAttempt {
            id: Uuid::new_v4().to_string(),
            verification_id: retry_request.verification_id.clone(),
            status: RepairAttemptStatus::AwaitingApproval,
            proposed_patch: Some(patch),
            error: None,
            attempt_number,
        };

        self.attempt_history.push(attempt.clone());

        Ok(attempt)
    }

    fn build_repair_context(&self, retry_request: &RetryRequest, attempt_number: i32) -> String {
        let previous_attempts: String = self
            .attempt_history
            .iter()
            .map(|a| {
                format!(
                    "Attempt {}: status={:?}, error={}",
                    a.attempt_number,
                    a.status,
                    a.error.as_deref().unwrap_or("none")
                )
            })
            .collect::<Vec<_>>()
            .join("\n");

        format!(
            "Failure summary: {}\nSuggested scope: {}\nAttempt: {}/{}\nPrevious attempts:\n{}\nAffected findings:\n{}",
            retry_request.failure_summary,
            retry_request.suggested_scope,
            attempt_number,
            self.max_retries,
            if previous_attempts.is_empty() {
                "None".to_string()
            } else {
                previous_attempts
            },
            retry_request
                .findings
                .iter()
                .map(|f| format!(
                    "- [{}] {} (files: {:?})",
                    format!("{:?}", f.classification),
                    f.message,
                    f.affected_files
                ))
                .collect::<Vec<_>>()
                .join("\n")
        )
    }

    pub fn reset(&mut self) {
        self.attempt_history.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::provider::EchoMockProvider;
    use codra_protocol::{FailureClassification, VerificationFinding, VerificationSeverity};

    #[test]
    fn repair_budget_tracking() {
        let provider = EchoMockProvider::new();
        let mut service = RepairService::new("/tmp", &provider).with_max_retries(2);

        assert!(!service.budget_exhausted());
        assert_eq!(service.attempt_count(), 0);

        let retry = RetryRequest {
            id: "r1".to_string(),
            verification_id: "v1".to_string(),
            execution_id: "e1".to_string(),
            step_id: "s1".to_string(),
            failure_summary: "test failed".to_string(),
            findings: vec![VerificationFinding {
                id: "f1".to_string(),
                severity: VerificationSeverity::Critical,
                classification: FailureClassification::TestFailure,
                message: "test error".to_string(),
                affected_files: vec!["src/main.rs".to_string()],
            }],
            suggested_scope: "fix test".to_string(),
        };

        let result = service.construct_repair_attempt(&retry);
        assert!(result.is_ok());
        assert_eq!(service.attempt_count(), 1);
        assert!(!service.budget_exhausted());

        let result2 = service.construct_repair_attempt(&retry);
        assert!(result2.is_ok());
        assert_eq!(service.attempt_count(), 2);
        assert!(service.budget_exhausted());

        let result3 = service.construct_repair_attempt(&retry);
        assert!(result3.is_err());
    }
}
