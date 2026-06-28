import chalk from 'chalk';
import { analyzeProject } from '../setup/analyze.js';
import { generateRecommendations } from '../setup/recommend.js';
import { formatAnalysis, formatRecommendation } from '../setup/format.js';
import { saveSetupReport, loadSetupReport } from '../setup/store.js';
export async function setupCommand(args) {
    const subcommand = args[0] || 'full';
    switch (subcommand) {
        case 'analyze': {
            const cwd = process.cwd();
            console.log(chalk.gray('\n  Analyzing project...\n'));
            const stack = analyzeProject(cwd);
            console.log(formatAnalysis(stack));
            break;
        }
        case 'recommend': {
            const cwd = process.cwd();
            console.log(chalk.gray('\n  Analyzing and recommending...\n'));
            const stack = analyzeProject(cwd);
            const recommendation = generateRecommendations(stack);
            console.log(formatAnalysis(stack));
            console.log(formatRecommendation(recommendation));
            break;
        }
        case 'status': {
            const cwd = process.cwd();
            const existing = loadSetupReport(cwd);
            if (existing) {
                console.log(chalk.cyan('\n  Setup Status:'));
                console.log(chalk.gray(`  Last analyzed: ${existing.analyzedAt}`));
                console.log(chalk.gray(`  Project type: ${existing.stack.projectType}`));
                console.log(chalk.gray(`  Recommended skills: ${existing.recommendation.recommendedSkills.length}`));
                console.log(chalk.gray(`  Confidence: ${existing.recommendation.confidence}%`));
                console.log('');
            }
            else {
                console.log(chalk.gray('\n  No setup analysis found. Run /setup to analyze your project.\n'));
            }
            break;
        }
        case 'apply': {
            const cwd = process.cwd();
            const existing = loadSetupReport(cwd);
            if (!existing) {
                console.log(chalk.gray('\n  No setup report found. Run /setup first.\n'));
                return;
            }
            console.log(chalk.cyan('\n  Setup Apply — Safe Changes:'));
            console.log(chalk.gray(`  Project type: ${existing.stack.projectType}`));
            console.log(chalk.gray(`  Recommended skills: ${existing.recommendation.recommendedSkills.length}`));
            console.log('');
            console.log(chalk.gray('  The following changes would be applied:'));
            console.log(chalk.gray(`    - Activate ${existing.recommendation.recommendedSkills.length} recommended skills`));
            console.log(chalk.gray(`    - Set permission level to ${existing.recommendation.recommendedPermissionLevel}`));
            console.log('');
            console.log(chalk.yellow('  Note: /setup apply is a preview in v0.1.'));
            console.log(chalk.yellow('  Full automated setup will be available in a future version.'));
            console.log('');
            break;
        }
        default: {
            const cwd = process.cwd();
            console.log(chalk.gray('\n  Running project analysis and recommendations...\n'));
            const stack = analyzeProject(cwd);
            const recommendation = generateRecommendations(stack);
            console.log(formatAnalysis(stack));
            console.log(formatRecommendation(recommendation));
            const report = {
                version: '0.1',
                analyzedAt: new Date().toISOString(),
                cwd,
                stack,
                recommendation
            };
            saveSetupReport(report);
            console.log(chalk.gray(`  Report saved to .codra/setup/latest.json`));
            console.log('');
            break;
        }
    }
}
