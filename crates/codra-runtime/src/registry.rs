use std::collections::HashMap;

use crate::error::{RuntimeError, RuntimeResult};
use crate::traits::CodraRuntime;
use crate::types::{RuntimeHealth, RuntimeId, RuntimeKind};

/// Global registry of available runtime adapters.
pub struct RuntimeRegistry {
    runtimes: HashMap<RuntimeId, Box<dyn CodraRuntime>>,
}

impl RuntimeRegistry {
    pub fn new() -> Self {
        Self {
            runtimes: HashMap::new(),
        }
    }

    /// Register a runtime. Returns an error if a runtime with the
    /// same ID is already registered.
    pub fn register(&mut self, runtime: Box<dyn CodraRuntime>) -> RuntimeResult<()> {
        let id = runtime.id().clone();
        if self.runtimes.contains_key(&id) {
            return Err(RuntimeError::AlreadyRegistered(id.0));
        }
        self.runtimes.insert(id, runtime);
        Ok(())
    }

    /// Get a runtime by ID.
    pub fn get(&self, id: &RuntimeId) -> Option<&dyn CodraRuntime> {
        self.runtimes.get(id).map(|b| b.as_ref())
    }

    /// List all registered runtimes.
    pub fn list(&self) -> Vec<&dyn CodraRuntime> {
        self.runtimes.values().map(|b| b.as_ref()).collect()
    }

    /// Get all runtimes of a specific kind.
    pub fn get_by_kind(&self, kind: RuntimeKind) -> Vec<&dyn CodraRuntime> {
        self.runtimes
            .values()
            .filter(|r| r.kind() == kind)
            .map(|b| b.as_ref())
            .collect()
    }

    /// Check health of all registered runtimes.
    pub async fn health_check_all(&self) -> HashMap<RuntimeId, RuntimeHealth> {
        let mut results = HashMap::new();
        for (id, runtime) in &self.runtimes {
            let health = runtime.health().await;
            results.insert(id.clone(), health);
        }
        results
    }
}

impl Default for RuntimeRegistry {
    fn default() -> Self {
        Self::new()
    }
}
