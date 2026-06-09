use codra_deploy::{default_container_name, is_valid_container_name, sanitize_segment};

#[test]
fn sanitize_segment_lowercases_and_replaces_invalid_chars() {
    assert_eq!(sanitize_segment("My App!"), "my-app");
    assert_eq!(sanitize_segment("API_v2"), "api-v2");
}

#[test]
fn default_container_name_uses_codra_prefix() {
    assert_eq!(default_container_name("My App", "Web Service"), "codra-my-app-web-service");
}

#[test]
fn valid_container_name_rules() {
    assert!(is_valid_container_name("codra-my-app-web"));
    assert!(!is_valid_container_name("Codra-Web"));
    assert!(!is_valid_container_name("-bad"));
    assert!(!is_valid_container_name("bad-"));
}