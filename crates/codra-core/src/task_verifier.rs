use crate::command_runner::CommandRunner;
use crate::command_safety::is_command_allowed;
use crate::task_store::TaskStore;
use codra_protocol::{CommandRun, TaskStatus, VerificationResult};
use std::time::Duration;

pub struct TaskVerifier<R: CommandRunner> {
    task_store: TaskStore,
    command_runner: R,
}

impl<R: CommandRunner> TaskVerifier<R> {
    pub fn new(task_store: TaskStore, command_runner: R) -> Self {
        Self {
            task_store,
            command_runner,
        }
    }

    pub fn run_verification(
        &self,
        task_id: &str,
        custom_commands: Option<Vec<String>>,
    ) -> Result<VerificationResult, String> {
        let mut task = self.task_store.load_task(task_id)?;
        self.task_store.assert_task_workspace(&task)?;

        match task.status {
            TaskStatus::Approved | TaskStatus::Executing | TaskStatus::Verifying => {}
            _ => {
                return Err(
                    "Task must be in Approved/Verifying state to run verification".to_string(),
                )
            }
        }

        task.status = TaskStatus::Verifying;
        self.task_store.save_task(&task)?;

        let commands = custom_commands.unwrap_or_else(|| {
            task.plan
                .as_ref()
                .map(|p| p.commands_to_run.clone())
                .unwrap_or_default()
        });

        let mut all_passed = true;
        let mut errors = vec![];

        for cmd in commands {
            if !is_command_allowed(&cmd, None).allowed {
                return Err(format!("Rejected dangerous command: {}", cmd));
            }

            // Run through CommandRunner
            let run_result = self.command_runner.run(
                &cmd,
                std::path::Path::new(&task.workspace_path),
                Duration::from_secs(120),
            )?;

            task.commands_run.push(run_result.clone());

            if run_result.status != "success" {
                all_passed = false;
                errors.push(format!("Command failed: {}", cmd));
            }
        }

        let result = VerificationResult {
            success: all_passed,
            summary: if all_passed {
                "All verification commands passed".to_string()
            } else {
                "Some verification commands failed".to_string()
            },
            errors,
        };

        task.verification_result = Some(result.clone());
        task.updated_at = current_timestamp();

        if all_passed {
            task.status = TaskStatus::Completed;
            task.final_report = Some("Task completed successfully".to_string());
            task.completed_at = Some(current_timestamp());
        } else {
            task.status = TaskStatus::RepairPlanning;
            if let Some(ref mut plan) = task.plan {
                plan.summary = "Verification failed. Review output and propose fix.".to_string();
                plan.risk_level = "medium".to_string();
            }
        }

        self.task_store.save_task(&task)?;
        Ok(result)
    }
}

fn current_timestamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}
