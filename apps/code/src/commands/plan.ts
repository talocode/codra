import chalk from 'chalk';
import { createPlan } from '../plans/planner.js';
import { savePlan, getPlan, listPlans } from '../plans/store.js';
import { formatPlan } from '../plans/format.js';
import { recommendSkills } from '../skills/recommender.js';
import { formatSkillRecommendations } from '../skills/format.js';

export async function planCommand(args: string[]) {
  if (args.length === 0) {
    console.log(chalk.gray('\n  Usage: /plan <task> | /plans | /plan show <id> | /plan approve <id> | /plan reject <id> | /plan run <id> | /plan status <id>\n'));
    return;
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'show':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /plan show <id>\n'));
        return;
      }
      const showPlan = getPlan(args[1]);
      if (showPlan) {
        console.log(formatPlan(showPlan));
      } else {
        console.log(chalk.red(`\n  Plan not found: ${args[1]}\n`));
      }
      break;

    case 'approve':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /plan approve <id>\n'));
        return;
      }
      const approvePlan = getPlan(args[1]);
      if (approvePlan) {
        approvePlan.status = 'approved';
        approvePlan.updatedAt = new Date().toISOString();
        savePlan(approvePlan);
        console.log(chalk.green(`\n  Plan ${args[1]} approved\n`));
      } else {
        console.log(chalk.red(`\n  Plan not found: ${args[1]}\n`));
      }
      break;

    case 'reject':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /plan reject <id>\n'));
        return;
      }
      const rejectPlan = getPlan(args[1]);
      if (rejectPlan) {
        rejectPlan.status = 'rejected';
        rejectPlan.updatedAt = new Date().toISOString();
        savePlan(rejectPlan);
        console.log(chalk.green(`\n  Plan ${args[1]} rejected\n`));
      } else {
        console.log(chalk.red(`\n  Plan not found: ${args[1]}\n`));
      }
      break;

    case 'run':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /plan run <id>\n'));
        return;
      }
      const runPlan = getPlan(args[1]);
      if (runPlan) {
        if (runPlan.status !== 'approved') {
          console.log(chalk.red(`\n  Plan must be approved before running. Current status: ${runPlan.status}\n`));
          return;
        }
        console.log(chalk.cyan(`\n  Running plan: ${runPlan.title}`));
        console.log(chalk.gray('  Execute steps manually using /run and file commands.\n'));
      } else {
        console.log(chalk.red(`\n  Plan not found: ${args[1]}\n`));
      }
      break;

    case 'status':
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /plan status <id>\n'));
        return;
      }
      const statusPlan = getPlan(args[1]);
      if (statusPlan) {
        console.log(chalk.cyan(`\n  Plan ${statusPlan.id}: ${statusPlan.status}`));
        console.log(chalk.gray(`  Steps: ${statusPlan.steps.length}`));
        console.log(chalk.gray(`  Completed: ${statusPlan.steps.filter(s => s.status === 'completed').length}\n`));
      } else {
        console.log(chalk.red(`\n  Plan not found: ${args[1]}\n`));
      }
      break;

    default:
      // Create a new plan
      const task = args.join(' ');
      const plan = createPlan(task);
      savePlan(plan);
      console.log(formatPlan(plan));

      // Show skill recommendations
      const recommended = recommendSkills(task);
      if (recommended.length > 0) {
        console.log(formatSkillRecommendations(recommended, task));
        console.log(chalk.gray('  Skill recommendations are suggestions. Use /skills use <name> to activate.'));
      }

      console.log(chalk.green(`\n  Plan created: ${plan.id}`));
      console.log(chalk.gray('  Use /plan approve <id> to approve and /plan run <id> to execute.\n'));
      break;
  }
}
