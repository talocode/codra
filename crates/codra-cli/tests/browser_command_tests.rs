use codra_cli::browser::execute_browser_command;

#[test]
fn cli_browser_check_rejects_localhost() {
    let result = execute_browser_command(&[
        "check".to_string(),
        "http://localhost:3000".to_string(),
    ]);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Localhost is disabled"));
}

#[test]
fn cli_browser_check_requires_url() {
    let result = execute_browser_command(&["check".to_string()]);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("URL is required"));
}

#[test]
fn cli_browser_check_rejects_unknown_subcommand() {
    let result = execute_browser_command(&["snapshot".to_string(), "https://example.com".to_string()]);

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("unknown browser subcommand"));
}