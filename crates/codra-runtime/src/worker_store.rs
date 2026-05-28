use crate::types::{StoredPairing, WorkerId};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct WorkersFile {
    workers: Vec<StoredPairing>,
}

/// File-backed persistent store for registered workers.
#[derive(Debug, Clone)]
pub struct WorkerStore {
    file_path: PathBuf,
}

impl WorkerStore {
    /// Open (or create) the worker store at `~/.codra/workers.json`.
    pub fn new_global() -> Self {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".to_string());
        let dir = PathBuf::from(home).join(".codra");
        let _ = fs::create_dir_all(&dir);
        let file_path = dir.join("workers.json");
        Self { file_path }
    }

    /// Open (or create) the worker store at a custom path.
    /// Used by tests to avoid touching ~/.codra.
    pub fn new_at(path: PathBuf) -> Self {
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        Self { file_path: path }
    }

    fn load(&self) -> WorkersFile {
        fs::read_to_string(&self.file_path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    fn save(&self, wf: &WorkersFile) -> Result<(), String> {
        let json = serde_json::to_string_pretty(wf).map_err(|e| e.to_string())?;
        fs::write(&self.file_path, json).map_err(|e| e.to_string())
    }

    /// Register a new worker.
    pub fn add_worker(&self, worker: StoredPairing) -> Result<(), String> {
        let mut wf = self.load();
        if wf.workers.iter().any(|w| w.worker_id == worker.worker_id) {
            return Err(format!(
                "Worker '{}' is already registered",
                worker.worker_id.0
            ));
        }
        wf.workers.push(worker);
        self.save(&wf)
    }

    /// Return all registered workers.
    pub fn list_workers(&self) -> Vec<StoredPairing> {
        self.load().workers
    }

    /// Look up a worker by its ID.
    pub fn get_worker(&self, worker_id: &WorkerId) -> Option<StoredPairing> {
        self.load()
            .workers
            .into_iter()
            .find(|w| w.worker_id == *worker_id)
    }

    /// Remove a registered worker by its ID.
    pub fn remove_worker(&self, worker_id: &WorkerId) -> Result<bool, String> {
        let mut wf = self.load();
        let before = wf.workers.len();
        wf.workers.retain(|w| w.worker_id != *worker_id);
        let removed = wf.workers.len() < before;
        if removed {
            self.save(&wf)?;
        }
        Ok(removed)
    }

    /// Update the `last_seen` timestamp for a worker.
    pub fn update_last_seen(
        &self,
        worker_id: &WorkerId,
        last_seen: impl Into<String>,
    ) -> Result<bool, String> {
        let mut wf = self.load();
        if let Some(worker) = wf.workers.iter_mut().find(|w| w.worker_id == *worker_id) {
            worker.last_seen = last_seen.into();
            self.save(&wf)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Returns the file path used by this store.
    pub fn file_path(&self) -> &PathBuf {
        &self.file_path
    }
}

// ── Tests ────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::TrustLevel;
    fn test_store() -> (WorkerStore, tempfile::TempDir) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("workers.json");
        let store = WorkerStore::new_at(path);
        (store, dir)
    }

    fn test_worker(id: &str) -> StoredPairing {
        StoredPairing {
            worker_id: WorkerId(id.to_string()),
            worker_label: format!("Worker {}", id),
            pin_sha256: "a3f1c8e2b7d4...".to_string(),
            worker_host: "127.0.0.1".to_string(),
            worker_port: 8080,
            trust_level: TrustLevel::Standard,
            paired_at: "2026-05-28T05:00:00Z".to_string(),
            last_seen: "2026-05-28T05:00:00Z".to_string(),
        }
    }

    #[test]
    fn add_and_list_workers() {
        let (store, _dir) = test_store();
        store.add_worker(test_worker("wkr-001")).unwrap();
        store.add_worker(test_worker("wkr-002")).unwrap();
        let workers = store.list_workers();
        assert_eq!(workers.len(), 2);
    }

    #[test]
    fn add_duplicate_worker_rejected() {
        let (store, _dir) = test_store();
        store.add_worker(test_worker("wkr-001")).unwrap();
        let err = store.add_worker(test_worker("wkr-001")).unwrap_err();
        assert!(err.contains("already registered"));
    }

    #[test]
    fn get_worker_returns_some() {
        let (store, _dir) = test_store();
        store.add_worker(test_worker("wkr-001")).unwrap();
        let worker = store.get_worker(&WorkerId("wkr-001".to_string()));
        assert!(worker.is_some());
        assert_eq!(worker.unwrap().worker_id.0, "wkr-001");
    }

    #[test]
    fn get_worker_returns_none() {
        let (store, _dir) = test_store();
        let worker = store.get_worker(&WorkerId("nonexistent".to_string()));
        assert!(worker.is_none());
    }

    #[test]
    fn remove_worker() {
        let (store, _dir) = test_store();
        store.add_worker(test_worker("wkr-001")).unwrap();
        let removed = store
            .remove_worker(&WorkerId("wkr-001".to_string()))
            .unwrap();
        assert!(removed);
        assert!(store.list_workers().is_empty());
    }

    #[test]
    fn remove_nonexistent_worker_returns_false() {
        let (store, _dir) = test_store();
        let removed = store.remove_worker(&WorkerId("ghost".to_string())).unwrap();
        assert!(!removed);
    }

    #[test]
    fn update_last_seen() {
        let (store, _dir) = test_store();
        store.add_worker(test_worker("wkr-001")).unwrap();
        let updated = store
            .update_last_seen(&WorkerId("wkr-001".to_string()), "2026-06-01T12:00:00Z")
            .unwrap();
        assert!(updated);
        let worker = store.get_worker(&WorkerId("wkr-001".to_string())).unwrap();
        assert_eq!(worker.last_seen, "2026-06-01T12:00:00Z");
    }

    #[test]
    fn trust_level_preserved() {
        let (store, _dir) = test_store();
        let mut w = test_worker("wkr-001");
        w.trust_level = TrustLevel::Elevated;
        store.add_worker(w).unwrap();
        let worker = store.get_worker(&WorkerId("wkr-001".to_string())).unwrap();
        assert_eq!(worker.trust_level, TrustLevel::Elevated);
    }

    #[test]
    fn fingerprint_preserved() {
        let (store, _dir) = test_store();
        let mut w = test_worker("wkr-001");
        w.pin_sha256 =
            "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678".to_string();
        store.add_worker(w).unwrap();
        let worker = store.get_worker(&WorkerId("wkr-001".to_string())).unwrap();
        assert_eq!(
            worker.pin_sha256,
            "deadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678"
        );
    }

    #[test]
    fn stored_data_survives_reload() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("workers.json");

        // First session: add workers
        {
            let store = WorkerStore::new_at(path.clone());
            store.add_worker(test_worker("wkr-001")).unwrap();
            store.add_worker(test_worker("wkr-002")).unwrap();
        }

        // Second session: reload from same path
        {
            let store = WorkerStore::new_at(path.clone());
            let workers = store.list_workers();
            assert_eq!(workers.len(), 2);
            assert_eq!(workers[0].worker_id.0, "wkr-001");
            assert_eq!(workers[1].worker_id.0, "wkr-002");
        }
    }
}
