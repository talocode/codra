use crate::command_runner::CommandRunner;
use crate::file_changes::{apply_file_change, validate_file_change};
use crate::task_store::TaskStore;
use codra_protocol::{FileChange, Task, TaskStatus};
use std::path::PathBuf;

pub struct TaskExecutor<R: CommandRunner> {
    task_store: TaskStore,
    _command_runner: std::marker::PhantomData<R>,
}

impl<R: CommandRunner> TaskExecutor<R> {
    pub fn new(task_store: TaskStore) -> Self {
        Self {
            task_store,
            _command_runner: std::marker::PhantomData,
        }
    }

    pub fn execute_approved_task(&self, task_id: &str) -> Result<Task, String> {
        let mut task = self.task_store.load_task(task_id)?;

        if task.status != TaskStatus::Approved {
            return Err("Task must be Approved before execution".to_string());
        }

        task.status = TaskStatus::Executing;
        self.task_store.save_task(&task)?;

        // Apply approved file changes
        self.apply_approved_file_changes(&mut task)?;

        task.status = TaskStatus::Verifying;
        self.task_store.save_task(&task)?;

        Ok(task)
    }

    fn apply_approved_file_changes(&self, task: &mut Task) -> Result<(), String> {
        let backup_dir = PathBuf::from(&task.workspace_path)
            .join(".codra")
            .join("tasks")
            .join(&task.id)
            .join("backups");

        for change in &mut task.changed_files {
            if change.approved && !change.applied {
                validate_file_change(std::path::Path::new(&task.workspace_path), change)?;
                apply_file_change(
                    std::path::Path::new(&task.workspace_path),
                    change,
                    &backup_dir,
                )?;
            }
        }

        self.task_store.save_task(task)?;
        Ok(())
    }
}
