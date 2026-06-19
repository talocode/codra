import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
const SKILLS_DIRS = [
    path.join(process.cwd(), 'skills'),
    path.join(process.cwd(), '.codra/skills'),
    path.join(os.homedir(), '.codra/skills')
];
export async function skillsCommand() {
    console.log(chalk.cyan('\n  Installed Skills:'));
    let found = false;
    for (const dir of SKILLS_DIRS) {
        if (fs.existsSync(dir)) {
            const skills = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
            for (const skill of skills) {
                console.log(chalk.gray(`  - ${skill} (${dir})`));
                found = true;
            }
        }
    }
    if (!found) {
        console.log(chalk.gray('  No skills found.'));
    }
    console.log('');
}
