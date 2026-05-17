use crate::command_safety::is_command_allowed;
use crate::task_store::TaskStore;
use crate::workspace_scanner::WorkspaceScanner;
use codra_protocol::{
    DetectedCommand, Task, TaskEvent, TaskPlan, TaskStatus, VerificationResult, WorkspaceContext,
};
use std::time::{SystemTime, UNIX_EPOCH};

pub struct TaskPlanner {
    task_store: TaskStore,
}

impl TaskPlanner {
    pub fn new(task_store: TaskStore) -> Self {
        Self { task_store }
    }

    pub fn create_task(
        &self,
        workspace_path: &str,
        user_prompt: &str,
        title: Option<&str>,
    ) -> Result<Task, String> {
        if user_prompt.trim().is_empty() {
            return Err("User prompt cannot be empty".to_string());
        }

        let now = current_timestamp();
        let task_id = format!("task_{}", now);

        let mut task = Task {
            id: task_id.clone(),
            title: title
                .map(|s| s.to_string())
                .unwrap_or_else(|| user_prompt[..user_prompt.len().min(60)].to_string()),
            user_prompt: user_prompt.to_string(),
            workspace_path: workspace_path.to_string(),
            status: TaskStatus::Planning,
            created_at: now.clone(),
            updated_at: now.clone(),
            completed_at: None,
            plan: None,
            repair_plan: None,
            changed_files: vec![],
            commands_run: vec![],
            verification_result: None,
            final_report: None,
            error: None,
        };

        self.task_store.save_task(&task)?;
        self.append_event(&task_id, "task.created", "Task created")?;

        // Scan workspace
        let context = WorkspaceScanner::scan(workspace_path)?;
        self.append_event(&task_id, "workspace.scanned", "Workspace context scanned")?;

        // Generate plan
        let plan = self.generate_plan(&task, &context);
        task.plan = Some(plan);
        task.status = TaskStatus::AwaitingApproval;
        task.updated_at = current_timestamp();

        self.task_store.save_task(&task)?;
        self.append_event(
            &task_id,
            "task.planned",
            "Task plan generated and awaiting approval",
        )?;

        Ok(task)
    }

    pub fn generate_plan(&self, task: &Task, context: &WorkspaceContext) -> TaskPlan {
        let prompt_lower = task.user_prompt.to_lowercase();

        let risk_level = if prompt_lower.contains("delete")
            || prompt_lower.contains("remove")
            || prompt_lower.contains("auth")
            || prompt_lower.contains("secret")
            || prompt_lower.contains("migration")
            || prompt_lower.contains("database")
            || prompt_lower.contains("deploy")
            || prompt_lower.contains("production")
        {
            "high".to_string()
        } else if prompt_lower.contains("readme")
            || prompt_lower.contains("comment")
            || prompt_lower.contains("doc")
        {
            "low".to_string()
        } else {
            "medium".to_string()
        };

        let commands: Vec<String> = context
            .suggested_commands
            .iter()
            .filter(|cmd| is_command_allowed(&cmd.command, Some(context)).allowed)
            .map(|c| c.command.clone())
            .collect();

        TaskPlan {
            summary: format!("Implement: {}", task.user_prompt),
            steps: vec![],
            files_to_read: context.detected_config_files.clone(),
            files_to_modify: vec![],
            commands_to_run: commands,
            risk_level,
            requires_approval: true,
        }
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
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string()
}
