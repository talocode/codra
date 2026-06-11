const SECRET_PATTERNS: &[&str] = &[
    "ghp_",
    "gho_",
    "github_pat_",
    "sk-",
    "sk_live_",
    "sk_test_",
    "api_key=",
    "apikey=",
    "password=",
    "passwd=",
    "secret=",
    "token=",
    "bearer ",
    "authorization:",
    "aws_secret",
    "private_key",
    "BEGIN RSA PRIVATE KEY",
    "BEGIN OPENSSH PRIVATE KEY",
];

pub fn line_looks_like_secret(line: &str) -> bool {
    let lower = line.to_lowercase();
    SECRET_PATTERNS
        .iter()
        .any(|pattern| lower.contains(&pattern.to_lowercase()))
}

pub fn filter_secret_lines(content: &str) -> String {
    content
        .lines()
        .filter(|line| !line_looks_like_secret(line))
        .collect::<Vec<_>>()
        .join("\n")
}

pub fn contains_secret_patterns(content: &str) -> bool {
    content.lines().any(line_looks_like_secret)
}