import chalk from 'chalk';
import { SkillMetadata } from './discovery.js';

export function formatSkillList(skills: SkillMetadata[]): string {
  if (skills.length === 0) {
    return chalk.gray('\n  No skills found.\n');
  }
  
  const lines: string[] = [];
  lines.push(chalk.cyan('\n  Installed Skills:'));
  
  for (const skill of skills) {
    const sourceIcon = skill.source === 'local' ? '📁' : 
                      skill.source === 'user' ? '👤' : '📦';
    lines.push(chalk.gray(`    ${sourceIcon} ${skill.name}`));
    lines.push(chalk.gray(`       ${skill.description}`));
    if (skill.tags.length > 0) {
      lines.push(chalk.gray(`       Tags: ${skill.tags.join(', ')}`));
    }
  }
  
  lines.push('');
  return lines.join('\n');
}

export function formatSkillRecommendations(skills: string[], task: string): string {
  const lines: string[] = [];
  lines.push(chalk.cyan(`\n  Recommended Skills for: "${task}"`));
  lines.push('');
  
  for (const skill of skills) {
    lines.push(chalk.gray(`    - ${skill}`));
  }
  
  lines.push('');
  lines.push(chalk.gray('  Use /skills use <name1,name2> to activate skills.'));
  lines.push('');
  
  return lines.join('\n');
}

export function formatActiveSkills(skills: { name: string; content: string }[]): string {
  if (skills.length === 0) {
    return chalk.gray('\n  No active skills.\n');
  }
  
  const lines: string[] = [];
  lines.push(chalk.cyan('\n  Active Skills:'));
  
  for (const skill of skills) {
    lines.push(chalk.gray(`    - ${skill.name}`));
  }
  
  lines.push('');
  return lines.join('\n');
}
