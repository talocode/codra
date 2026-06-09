/// Sanitize a project or service segment for Docker image/container names.
pub fn sanitize_segment(value: &str) -> String {
    let mut out = String::new();
    let mut last_was_dash = false;

    for ch in value.to_lowercase().chars() {
        let mapped = if ch.is_ascii_alphanumeric() {
            ch
        } else {
            '-'
        };

        if mapped == '-' {
            if !out.is_empty() && !last_was_dash {
                out.push('-');
                last_was_dash = true;
            }
        } else {
            out.push(mapped);
            last_was_dash = false;
        }
    }

    while out.ends_with('-') {
        out.pop();
    }

    if out.is_empty() {
        "service".to_string()
    } else {
        out
    }
}

pub fn default_container_name(project: &str, service: &str) -> String {
    format!(
        "codra-{}-{}",
        sanitize_segment(project),
        sanitize_segment(service)
    )
}

pub fn default_image_name(project: &str, service: &str) -> String {
    format!(
        "codra-{}-{}:latest",
        sanitize_segment(project),
        sanitize_segment(service)
    )
}

pub fn is_valid_container_name(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 128
        && name
            .chars()
            .all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
        && !name.starts_with('-')
        && !name.ends_with('-')
}

