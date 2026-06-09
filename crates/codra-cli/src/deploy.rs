use codra_deploy::execute_deploy;

pub fn execute_deploy_command(args: &[String]) -> Result<(), String> {
    execute_deploy(args)
}
