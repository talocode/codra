import chalk from 'chalk';
import { Plan, PlanStep } from './types.js';

export function formatPlan(plan: Plan): string {
  const lines: string[] = [];
  
  lines.push(chalk.cyan(`\n  Plan: ${plan.title}`));
  lines.push(chalk.gray(`  ID: ${plan.id}`));
  lines.push(chalk.gray(`  Status: ${plan.status}`));
  lines.push(chalk.gray(`  Created: ${plan.createdAt}`));
  lines.push(chalk.gray(`  Provider: ${plan.provider} / ${plan.model}`));
  if (plan.activeSkill) {
    lines.push(chalk.gray(`  Skill: ${plan.activeSkill}`));
  }
  lines.push('');
  
  lines.push(chalk.cyan('  Steps:'));
  plan.steps.forEach((step, i) => {
    const statusIcon = step.status === 'completed' ? '✓' : step.status === 'running' ? '→' : '○';
    const riskColor = step.riskLevel === 'high' ? chalk.red : step.riskLevel === 'medium' ? chalk.yellow : chalk.gray;
    lines.push(`    ${statusIcon} ${i + 1}. ${step.title} ${riskColor(`[${step.riskLevel}]`)}`);
    lines.push(chalk.gray(`       ${step.description}`));
    if (step.command) {
      lines.push(chalk.gray(`       Command: ${step.command}`));
    }
  });
  
  if (plan.risks.length > 0) {
    lines.push('');
    lines.push(chalk.yellow('  Risks:'));
    plan.risks.forEach(r => lines.push(chalk.gray(`    - ${r}`)));
  }
  
  if (plan.validation.length > 0) {
    lines.push('');
    lines.push(chalk.cyan('  Validation:'));
    plan.validation.forEach(v => lines.push(chalk.gray(`    - ${v}`)));
  }
  
  return lines.join('\n');
}
