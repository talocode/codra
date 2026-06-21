import * as fs from 'fs';
import chalk from 'chalk';
import { discoverSkills, getSkillByName } from '../skills/discovery.js';
import { recommendSkills } from '../skills/recommender.js';
import { formatSkillList, formatSkillRecommendations, formatActiveSkills } from '../skills/format.js';
import { getActiveSkills, setActiveSkill, clearActiveSkill } from '../skills/active.js';
import { loadSkill } from '../skills/loader.js';
import { getAllSkillPaths, loadSkillsConfig } from '../skills/config.js';
export async function skillsCommand(args) {
    if (args.length === 0) {
        const skills = discoverSkills();
        console.log(formatSkillList(skills));
        return;
    }
    const subcommand = args[0];
    switch (subcommand) {
        case 'recommend': {
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /skills recommend <task>\n'));
                return;
            }
            const task = args.slice(1).join(' ');
            const recommended = recommendSkills(task);
            console.log(formatSkillRecommendations(recommended, task));
            break;
        }
        case 'active': {
            const active = getActiveSkills();
            console.log(formatActiveSkills(active));
            break;
        }
        case 'clear': {
            clearActiveSkill();
            console.log(chalk.green('\n  Active skills cleared.\n'));
            break;
        }
        case 'paths': {
            const searchPaths = getAllSkillPaths();
            const config = loadSkillsConfig();
            console.log(chalk.cyan('\n  Skill Search Paths:'));
            searchPaths.forEach(p => {
                const exists = fs.existsSync(p);
                console.log(chalk.gray(`    ${exists ? '✓' : '○'} ${p}`));
            });
            console.log(chalk.gray(`\n  Config: maxActiveSkills=${config.maxActiveSkills}, maxSkillContextChars=${config.maxSkillContextChars}`));
            console.log('');
            break;
        }
        case 'use': {
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /skills use <name1,name2,...>\n'));
                return;
            }
            const skillNames = args[1].split(',');
            for (const name of skillNames) {
                const skill = getSkillByName(name.trim());
                if (skill) {
                    const content = await loadSkill(name.trim());
                    if (content) {
                        setActiveSkill(name.trim(), content);
                        console.log(chalk.green(`  Activated: ${name.trim()}`));
                    }
                }
                else {
                    console.log(chalk.red(`  Skill not found: ${name.trim()}`));
                }
            }
            console.log('');
            break;
        }
        default: {
            // Try to activate a skill by name
            const skill = getSkillByName(subcommand);
            if (skill) {
                const content = await loadSkill(subcommand);
                if (content) {
                    setActiveSkill(subcommand, content);
                    console.log(chalk.green(`\n  Activated skill: ${subcommand}\n`));
                }
            }
            else {
                console.log(chalk.gray('\n  Usage: /skills | /skills recommend <task> | /skills use <name> | /skills active | /skills paths\n'));
            }
            break;
        }
    }
}
