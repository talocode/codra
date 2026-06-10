use std::env;

const BLOCKED_SCHEMES: &[&str] = &["file", "data", "javascript", "chrome", "about"];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedHttpUrl {
    pub scheme: String,
    pub host: String,
}

pub fn assert_safe_url(raw_url: &str) -> Result<ParsedHttpUrl, String> {
    let trimmed = raw_url.trim();
    if trimmed.is_empty() {
        return Err("URL is required".to_string());
    }

    let (scheme, rest) = parse_scheme(trimmed)?;
    let scheme_lower = scheme.to_ascii_lowercase();

    if scheme_lower != "http" && scheme_lower != "https" {
        return Err(format!("Blocked protocol: {scheme_lower}:"));
    }

    if BLOCKED_SCHEMES.contains(&scheme_lower.as_str()) {
        return Err(format!("Blocked protocol: {scheme_lower}:"));
    }

    let host = parse_host(rest)?;
    let host_lower = host.to_ascii_lowercase();
    let allow_localhost = env::var("AGENT_BROWSER_ALLOW_LOCALHOST")
        .ok()
        .as_deref()
        == Some("1");

    if !allow_localhost {
        if is_localhost_hostname(&host_lower) {
            return Err(
                "Localhost is disabled by default. Set AGENT_BROWSER_ALLOW_LOCALHOST=1 for local development."
                    .to_string(),
            );
        }

        if is_private_ipv4(&host_lower) || is_private_ipv6(&host_lower) {
            return Err(format!(
                "Private or loopback address is not allowed: {host_lower}"
            ));
        }
    } else {
        let allowed_local = is_localhost_hostname(&host_lower)
            || host_lower == "127.0.0.1"
            || host_lower == "::1";

        if !allowed_local && (is_private_ipv4(&host_lower) || is_private_ipv6(&host_lower)) {
            return Err(format!(
                "Private network address is not allowed: {host_lower}"
            ));
        }
    }

    Ok(ParsedHttpUrl {
        scheme: scheme_lower,
        host: host_lower,
    })
}

fn parse_scheme(raw_url: &str) -> Result<(&str, &str), String> {
    let lower = raw_url.to_ascii_lowercase();
    if let Some(rest) = lower.strip_prefix("https://") {
        let offset = raw_url.len() - rest.len();
        return Ok(("https", &raw_url[offset..]));
    }
    if let Some(rest) = lower.strip_prefix("http://") {
        let offset = raw_url.len() - rest.len();
        return Ok(("http", &raw_url[offset..]));
    }

    Err(format!("Invalid URL: {raw_url}"))
}

fn parse_host(rest: &str) -> Result<String, String> {
    let authority_end = rest
        .find(&['/', '?', '#'][..])
        .unwrap_or(rest.len());
    let authority = &rest[..authority_end];

    if authority.is_empty() {
        return Err("URL is missing a host".to_string());
    }

    if authority.starts_with('[') {
        let end = authority
            .find(']')
            .ok_or_else(|| format!("Invalid IPv6 host in URL: {rest}"))?;
        return Ok(authority[1..end].to_string());
    }

    let host_end = authority
        .rfind(':')
        .filter(|index| {
            authority[*index + 1..]
                .chars()
                .all(|ch| ch.is_ascii_digit())
        })
        .unwrap_or(authority.len());

    let host = &authority[..host_end];
    if host.is_empty() {
        return Err("URL is missing a host".to_string());
    }

    Ok(host.to_string())
}

fn is_localhost_hostname(hostname: &str) -> bool {
    hostname == "localhost" || hostname.ends_with(".localhost")
}

fn is_private_ipv4(hostname: &str) -> bool {
    let parts: Vec<u16> = hostname.split('.').filter_map(|part| part.parse().ok()).collect();
    if parts.len() != 4 || parts.iter().any(|part| *part > 255) {
        return false;
    }

    let [a, b, _, _] = parts.as_slice() else {
        return false;
    };

    *a == 127 || *a == 0 || *a == 10 || (*a == 172 && (16..=31).contains(b)) || (*a == 192 && *b == 168)
}

fn is_private_ipv6(hostname: &str) -> bool {
    let normalized = hostname.to_ascii_lowercase();
    if normalized == "::1" || normalized == "0:0:0:0:0:0:0:1" {
        return true;
    }

    let without_brackets = normalized.trim_matches(&['[', ']'][..]);
    if without_brackets.starts_with("fc") || without_brackets.starts_with("fd") {
        return true;
    }

    without_brackets.starts_with("fe8")
        || without_brackets.starts_with("fe9")
        || without_brackets.starts_with("fea")
        || without_brackets.starts_with("feb")
}