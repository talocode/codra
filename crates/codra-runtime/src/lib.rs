pub mod error;
pub mod pairing;
pub mod registry;
pub mod traits;
pub mod types;

pub mod stub;

// Re-exports for external consumers
pub use error::{RuntimeError, RuntimeResult};
pub use pairing::{PairingFingerprint, PairingPin, PairingPreview, PairingVerificationResult};
pub use registry::RuntimeRegistry;
pub use traits::{CodraRuntime, EventStream};
pub use types::*;
