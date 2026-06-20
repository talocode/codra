import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { createVisualPlanFromTask } from '../visualPlans/generator.js';
import { saveVisualPlan, getVisualPlan, listVisualPlans } from '../visualPlans/store.js';
import { formatVisualPlanConsole, formatVisualPlanMarkdown } from '../visualPlans/format.js';
export async function visualPlanCommand(args) {
    if (args.length === 0) {
        console.log(chalk.gray('\n  Usage: /visual-plan <planId> | /visual-plan from-task <task> | /visual-plans | /visual-plan show <id> | /visual-plan export <id>\n'));
        return;
    }
    const subcommand = args[0];
    switch (subcommand) {
        case 'from-task':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /visual-plan from-task <task>\n'));
                return;
            }
            const task = args.slice(1).join(' ');
            const visualPlan = createVisualPlanFromTask(task);
            saveVisualPlan(visualPlan);
            console.log(formatVisualPlanConsole(visualPlan));
            console.log(chalk.green(`  Visual plan created: ${visualPlan.id}\n`));
            break;
        case 'show':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /visual-plan show <id>\n'));
                return;
            }
            const showPlan = getVisualPlan(args[1]);
            if (showPlan) {
                console.log(formatVisualPlanConsole(showPlan));
            }
            else {
                console.log(chalk.red(`\n  Visual plan not found: ${args[1]}\n`));
            }
            break;
        case 'export':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /visual-plan export <id>\n'));
                return;
            }
            const exportPlan = getVisualPlan(args[1]);
            if (exportPlan) {
                const exportDir = path.join(process.cwd(), '.codra', 'visual-plans');
                if (!fs.existsSync(exportDir)) {
                    fs.mkdirSync(exportDir, { recursive: true });
                }
                const exportPath = path.join(exportDir, `${exportPlan.id}.md`);
                fs.writeFileSync(exportPath, formatVisualPlanMarkdown(exportPlan));
                console.log(chalk.green(`\n  Visual plan exported to: ${exportPath}\n`));
            }
            else {
                console.log(chalk.red(`\n  Visual plan not found: ${args[1]}\n`));
            }
            break;
        case 'approve':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /visual-plan approve <id>\n'));
                return;
            }
            const approvePlan = getVisualPlan(args[1]);
            if (approvePlan) {
                approvePlan.approval.status = 'approved';
                approvePlan.approval.approvedAt = new Date().toISOString();
                approvePlan.updatedAt = new Date().toISOString();
                saveVisualPlan(approvePlan);
                console.log(chalk.green(`\n  Visual plan ${args[1]} approved\n`));
            }
            else {
                console.log(chalk.red(`\n  Visual plan not found: ${args[1]}\n`));
            }
            break;
        case 'reject':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /visual-plan reject <id>\n'));
                return;
            }
            const rejectPlan = getVisualPlan(args[1]);
            if (rejectPlan) {
                rejectPlan.approval.status = 'rejected';
                rejectPlan.updatedAt = new Date().toISOString();
                saveVisualPlan(rejectPlan);
                console.log(chalk.green(`\n  Visual plan ${args[1]} rejected\n`));
            }
            else {
                console.log(chalk.red(`\n  Visual plan not found: ${args[1]}\n`));
            }
            break;
        default:
            // Create visual plan from plan ID
            const planId = args[0];
            const plan = getVisualPlan(planId);
            if (plan) {
                console.log(formatVisualPlanConsole(plan));
            }
            else {
                console.log(chalk.gray('\n  Usage: /visual-plan <planId> | /visual-plan from-task <task> | /visual-plans\n'));
            }
            break;
    }
}
export async function visualPlansCommand() {
    const plans = listVisualPlans();
    if (plans.length === 0) {
        console.log(chalk.gray('\n  No visual plans found. Create one with: /visual-plan from-task <task>\n'));
        return;
    }
    console.log(chalk.cyan('\n  Visual Plans:'));
    plans.forEach(plan => {
        const statusColor = plan.status === 'approved' ? chalk.green :
            plan.status === 'rejected' ? chalk.red : chalk.gray;
        console.log(`    ${statusColor(plan.status.padEnd(10))} ${plan.id} - ${plan.title}`);
    });
    console.log('');
}
