import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
const PLUGIN_DIRS = [
    path.join(process.cwd(), 'plugins'),
    path.join(process.cwd(), '.codra/plugins'),
    path.join(os.homedir(), '.codra/plugins')
];
export async function pluginsCommand() {
    console.log(chalk.cyan('\n  Installed Plugins:'));
    let found = false;
    for (const dir of PLUGIN_DIRS) {
        if (fs.existsSync(dir)) {
            const plugins = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
            for (const plugin of plugins) {
                console.log(chalk.gray(`  - ${plugin} (${dir})`));
                found = true;
            }
        }
    }
    if (!found) {
        console.log(chalk.gray('  No plugins found.'));
    }
    console.log('');
}
