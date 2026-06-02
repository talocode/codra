/// Redact values that must never appear in logs or warnings.
pub fn redact_secrets(message: &str) -> String {
    let mut out = message.to_string();
    for marker in ["ghp_", "github_pat_", "Bearer ", "Authorization:"] {
        if let Some(idx) = out.find(marker) {
            let end = out[idx..]
                .find(|c: char| c.is_whitespace() || c == '\n')
                .map(|i| idx + i)
                .unwrap_or(out.len());
            out.replace_range(idx..end, "[REDACTED]");
        }
    }
    out
}