use crate::command_safety::is_command_allowed;
use crate::task_store::TaskStore;
use codra_protocol::{Task, TaskEvent, TaskStatus};

pub struct TaskLifecycle {
    task_store: TaskStore,
}

impl TaskLifecycle {
    pub fn new(task_store: TaskStore) -> Self {
        Self { task_store }
    }

    pub fn approve_task(&self, task_id: &str) -> Result<Task, String> {
        let mut task = self.task_store.load_task(task_id)?;

        if task.status != TaskStatus::AwaitingApproval {
            return Err(format!(
                "Cannot approve task in status {:?}. Must be AwaitingApproval",
                task.status
            ));
        }

        task.status = TaskStatus::Approved;
        task.updated_at = current_timestamp();
        self.task_store.save_task(&task)?;
        self.append_event(task_id, "task.approved", "User approved the plan")?;

        Ok(task)
    }

    pub fn cancel_task(&self, task_id: &str, reason: Option<&str>) -> Result<Task, String> {
        let mut task = self.task_store.load_task(task_id)?;

        match task.status {
            TaskStatus::Draft
            | TaskStatus::Planning
            | TaskStatus::AwaitingApproval
            | TaskStatus::Approved
            | TaskStatus::RepairPlanning
            | TaskStatus::AwaitingRepairApproval => {
                task.status = TaskStatus::Cancelled;
                task.updated_at = current_timestamp();
                if let Some(r) = reason {
                    task.error = Some(r.to_string());
                }
                self.task_store.save_task(&task)?;
                self.append_event(
                    task_id,
                    "task.cancelled",
                    &format!("Task cancelled: {}", reason.unwrap_or("No reason")),
                )?;
                Ok(task)
            }
            _ => Err("Cannot cancel task in current state".to_string()),
        }
    }

    pub fn mark_task_failed(&self, task_id: &str, error: &str) -> Result<Task, String> {
        let mut task = self.task_store.load_task(task_id)?;
        task.status = TaskStatus::Failed;
        task.error = Some(error.to_string());
        task.updated_at = current_timestamp();
        self.task_store.save_task(&task)?;
        self.append_event(task_id, "task.failed", error)?;
        Ok(task)
    }

    fn append_event(&self, task_id: &str, event_type: &str, message: &str) -> Result<(), String> {
        let event = TaskEvent {
            id: format!("evt_{}", current_timestamp()),
            task_id: task_id.to_string(),
            timestamp: current_timestamp(),
            event_type: event_type.to_string(),
            message: message.to_string(),
        };
        self.task_store.append_event(&event)
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
