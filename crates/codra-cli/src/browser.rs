use codra_deploy::execute_browser_check;

pub fn execute_browser_command(args: &[String]) -> Result<(), String> {
    execute_browser_check(args)
}