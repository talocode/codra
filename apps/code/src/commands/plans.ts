import chalk from 'chalk';
import { listPlans } from '../plans/store.js';

export async function plansCommand() {
  const plans = listPlans();
  
  if (plans.length === 0) {
    console.log(chalk.gray('\n  No plans found. Create one with: /plan <task>\n'));
    return;
  }
  
  console.log(chalk.cyan('\n  Plans:'));
  plans.forEach(plan => {
    const statusColor = plan.status === 'completed' ? chalk.green : 
                       plan.status === 'approved' ? chalk.blue :
                       plan.status === 'running' ? chalk.yellow : chalk.gray;
    console.log(`    ${statusColor(plan.status.padEnd(10))} ${plan.id} - ${plan.title}`);
  });
  console.log('');
}
