use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fmt;

// ── Core Types ──────────────────────────────────────────────────

/// A SHA-256 fingerprint derived from identity material (e.g. a
/// X25519 static public key). Used for out-of-band verification
/// during controller-worker pairing.
///
/// The hex encoding is lowercase, 64 characters.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct PairingFingerprint(String);

impl PairingFingerprint {
    /// Number of hex characters in a SHA-256 digest.
    pub const HEX_LEN: usize = 64;

    /// The number of hex nibbles used for the short PIN.
    pub const PIN_NIBBLES: usize = 4;

    /// Derive a fingerprint from raw identity bytes (e.g. a public key).
    ///
    /// The input is hashed with SHA-256. The hex encoding is lowercase,
    /// 64 characters. This is deterministic: same bytes → same fingerprint.
    pub fn from_bytes(bytes: &[u8]) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        let result = hasher.finalize();
        Self(format!("{:x}", result))
    }

    /// Return the full 64-character hex string.
    pub fn as_hex(&self) -> &str {
        &self.0
    }

    /// Return the short human-checkable PIN (first 4 hex characters).
    ///
    /// This gives 65,536 possible values — sufficient for a
    /// same-room OOB verification where the user visually compares
    /// two displays.
    pub fn pin(&self) -> PairingPin {
        PairingPin(self.0[..Self::PIN_NIBBLES].to_string())
    }

    /// Check whether this fingerprint matches another.
    pub fn matches(&self, other: &PairingFingerprint) -> PairingVerificationResult {
        if self.0 == other.0 {
            PairingVerificationResult::Match
        } else {
            PairingVerificationResult::Mismatch
        }
    }
}

impl fmt::Display for PairingFingerprint {
    /// Display as a shortened form suitable for UI labels.
    /// Shows first 8 hex chars + "..." to avoid overwhelming the user.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let truncated: String = self.0.chars().take(8).collect();
        write!(f, "{}…", truncated)
    }
}

// ── Pairing PIN ──────────────────────────────────────────────────

/// A short human-checkable PIN derived from a [`PairingFingerprint`].
///
/// The PIN is the first 4 hex characters of the SHA-256 digest.
/// Users compare this PIN out-of-band (e.g. "my display shows `a3f1` —
/// does yours?").
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct PairingPin(String);

impl PairingPin {
    /// Return the PIN as a string slice.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for PairingPin {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

// ── Verification Result ──────────────────────────────────────────

/// The result of checking whether two fingerprints match.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PairingVerificationResult {
    /// The two fingerprints are identical — trust can proceed.
    #[serde(rename = "match")]
    Match,
    /// The two fingerprints differ — do not trust.
    #[serde(rename = "mismatch")]
    Mismatch,
}

impl PairingVerificationResult {
    /// Returns `true` if the result is a match.
    pub fn is_match(&self) -> bool {
        matches!(self, Self::Match)
    }
}

// ── Pairing Preview ──────────────────────────────────────────────

/// A snapshot of a pending pairing that can be displayed to the user
/// before they approve or reject.
///
/// Both sides construct their own preview and show it so the user
/// can compare the PIN out-of-band.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairingPreview {
    /// The party that initiated the pairing request.
    pub initiator_label: String,
    /// The fingerprint of the initiator.
    pub initiator_fingerprint: PairingFingerprint,
    /// The party that received the pairing request.
    pub responder_label: String,
    /// The fingerprint of the responder.
    pub responder_fingerprint: PairingFingerprint,
    /// The short PIN — first 4 hex chars of the responder's fingerprint.
    /// This is what the user compares out-of-band.
    pub pin: PairingPin,
}

impl PairingPreview {
    /// Build a preview for a pending pairing.
    ///
    /// # Arguments
    /// * `initiator_label` — Human-readable name of the party requesting the pair.
    /// * `initiator_bytes` — Identity bytes of the initiator (e.g. public key).
    /// * `responder_label` — Human-readable name of the party being paired to.
    /// * `responder_bytes` — Identity bytes of the responder (e.g. public key).
    pub fn new(
        initiator_label: impl Into<String>,
        initiator_bytes: &[u8],
        responder_label: impl Into<String>,
        responder_bytes: &[u8],
    ) -> Self {
        let responder_fp = PairingFingerprint::from_bytes(responder_bytes);
        let pin = responder_fp.pin();
        Self {
            initiator_label: initiator_label.into(),
            initiator_fingerprint: PairingFingerprint::from_bytes(initiator_bytes),
            responder_label: responder_label.into(),
            responder_fingerprint: responder_fp,
            pin,
        }
    }

    /// Verify that the responder's fingerprint matches the expected one.
    pub fn verify_responder(&self, responder_bytes: &[u8]) -> PairingVerificationResult {
        let expected = PairingFingerprint::from_bytes(responder_bytes);
        self.responder_fingerprint.matches(&expected)
    }
}

// ── Tests ────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn alice_material() -> Vec<u8> {
        b"alice-identity-material-x25519-pubkey".to_vec()
    }

    fn bob_material() -> Vec<u8> {
        b"bob-identity-material-x25519-pubkey".to_vec()
    }

    #[test]
    fn same_input_gives_same_fingerprint() {
        let material = b"test-identity-bytes";
        let fp1 = PairingFingerprint::from_bytes(material);
        let fp2 = PairingFingerprint::from_bytes(material);
        assert_eq!(fp1, fp2);
        assert_eq!(fp1.as_hex(), fp2.as_hex());
    }

    #[test]
    fn different_input_gives_different_fingerprint() {
        let fp1 = PairingFingerprint::from_bytes(b"hello");
        let fp2 = PairingFingerprint::from_bytes(b"world");
        assert_ne!(fp1, fp2);
    }

    #[test]
    fn fingerprint_is_64_hex_chars() {
        let fp = PairingFingerprint::from_bytes(b"anything");
        assert_eq!(fp.as_hex().len(), 64);

        // Verify all chars are hex
        let all_hex = fp.as_hex().chars().all(|c| c.is_ascii_hexdigit());
        assert!(all_hex);
    }

    #[test]
    fn fingerprint_is_lowercase() {
        let fp = PairingFingerprint::from_bytes(b"stuff");
        assert_eq!(fp.as_hex(), fp.as_hex().to_lowercase());
    }

    #[test]
    fn pin_is_first_4_hex_chars() {
        let fp = PairingFingerprint::from_bytes(b"pin-test");
        let pin = fp.pin();
        assert_eq!(pin.as_str().len(), 4);
        assert_eq!(pin.as_str(), &fp.as_hex()[..4]);
    }

    #[test]
    fn pin_stability() {
        let fp = PairingFingerprint::from_bytes(b"stable-pin");
        let pin1 = fp.pin();
        let pin2 = fp.pin();
        assert_eq!(pin1, pin2);
    }

    #[test]
    fn pin_is_hex() {
        let fp = PairingFingerprint::from_bytes(b"hex-pin");
        let pin = fp.pin();
        assert!(pin.as_str().chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn verify_match_returns_success() {
        let material = b"matching-material";
        let fp1 = PairingFingerprint::from_bytes(material);
        let fp2 = PairingFingerprint::from_bytes(material);
        let result = fp1.matches(&fp2);
        assert_eq!(result, PairingVerificationResult::Match);
        assert!(result.is_match());
    }

    #[test]
    fn verify_mismatch_returns_failure() {
        let fp1 = PairingFingerprint::from_bytes(b"material-a");
        let fp2 = PairingFingerprint::from_bytes(b"material-b");
        let result = fp1.matches(&fp2);
        assert_eq!(result, PairingVerificationResult::Mismatch);
        assert!(!result.is_match());
    }

    #[test]
    fn pairing_preview_serializes_deserializes() {
        let preview = PairingPreview::new("Alice", &alice_material(), "Bob", &bob_material());
        let json = serde_json::to_string(&preview).unwrap();
        let deserialized: PairingPreview = serde_json::from_str(&json).unwrap();

        assert_eq!(preview.initiator_label, deserialized.initiator_label);
        assert_eq!(preview.responder_label, deserialized.responder_label);
        assert_eq!(
            preview.initiator_fingerprint,
            deserialized.initiator_fingerprint
        );
        assert_eq!(
            preview.responder_fingerprint,
            deserialized.responder_fingerprint
        );
        assert_eq!(preview.pin, deserialized.pin);
    }

    #[test]
    fn pairing_preview_pin_comes_from_responder() {
        let preview =
            PairingPreview::new("Controller", b"ctrl-material", "Worker", b"worker-material");
        let worker_fp = PairingFingerprint::from_bytes(b"worker-material");
        assert_eq!(preview.pin, worker_fp.pin());
        assert_ne!(
            preview.pin,
            PairingFingerprint::from_bytes(b"ctrl-material").pin()
        );
    }

    #[test]
    fn pairing_preview_verify_responder_success() {
        let preview = PairingPreview::new("Me", b"my-material", "Worker", b"worker-material");
        assert!(preview.verify_responder(b"worker-material").is_match());
    }

    #[test]
    fn pairing_preview_verify_responder_failure() {
        let preview = PairingPreview::new("Me", b"my-material", "Worker", b"worker-material");
        assert!(!preview
            .verify_responder(b"wrong-worker-material")
            .is_match());
    }

    #[test]
    fn fingerprint_display_truncates() {
        let fp = PairingFingerprint::from_bytes(b"display-test");
        let display = format!("{}", fp);
        // Should show first 8 hex chars + "…" = 9 characters
        assert_eq!(display.chars().count(), 9);
        assert!(display.ends_with('…'));
        let truncated: String = display.chars().take(8).collect();
        assert_eq!(truncated, &fp.as_hex()[..8]);
    }

    #[test]
    fn pairing_preview_json_structure() {
        let preview = PairingPreview::new("Controller", b"ctrl-key", "Worker One", b"worker-key");
        let json = serde_json::to_value(&preview).unwrap();
        assert_eq!(json["initiator_label"], "Controller");
        assert_eq!(json["responder_label"], "Worker One");
        assert_eq!(json["pin"], preview.pin.as_str());
        assert_eq!(json["initiator_fingerprint"].as_str().unwrap().len(), 64);
        assert_eq!(json["responder_fingerprint"].as_str().unwrap().len(), 64);
    }

    #[test]
    fn fingerprint_is_deterministic() {
        // Run 10 times — must produce identical hex each time
        let hexes: Vec<String> = (0..10)
            .map(|_| {
                PairingFingerprint::from_bytes(b"deterministic")
                    .as_hex()
                    .to_string()
            })
            .collect();
        for h in &hexes[1..] {
            assert_eq!(*h, hexes[0]);
        }
    }

    #[test]
    fn empty_bytes_produces_valid_fingerprint() {
        let fp = PairingFingerprint::from_bytes(b"");
        assert_eq!(fp.as_hex().len(), 64);
    }
}
