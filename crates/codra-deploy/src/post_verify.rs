use crate::agent_browser_exec::AgentBrowserExecutor;
use crate::cli::verify::{run_verify_with_executor, VerifyOptions};
use crate::config::{DeployConfig, DeployServiceConfig};

pub const MISSING_VERIFY_URL_WARNING: &str =
    "No verification URL configured. Skipping post-deploy verification.";

pub fn run_post_deploy_verification(
    config: &DeployConfig,
    service_filter: Option<&str>,
    json: bool,
    executor: &dyn AgentBrowserExecutor,
) -> Result<(), String> {
    let services = matching_services(config, service_filter);

    for service in services {
        let Some(verify) = service.verify.as_ref() else {
            continue;
        };

        if !verify.enabled {
            continue;
        }

        let url = verify
            .url
            .as_ref()
            .map(|value| value.trim())
            .filter(|value| !value.is_empty());

        let Some(url) = url else {
            println!("{MISSING_VERIFY_URL_WARNING}");
            continue;
        };

        let options = VerifyOptions {
            url: url.to_string(),
            screenshot_out: verify.screenshot_out.clone(),
            vision: verify.vision,
            json,
            allow_warnings: verify.allow_warnings,
            agent_browser_bin: "agent-browser".to_string(),
        };

        run_verify_with_executor(&options, executor)?;
    }

    Ok(())
}

fn matching_services<'a>(
    config: &'a DeployConfig,
    service_filter: Option<&str>,
) -> Vec<&'a DeployServiceConfig> {
    config
        .services
        .iter()
        .filter(|service| {
            service_filter
                .map(|name| service.name == name)
                .unwrap_or(true)
        })
        .collect()
}