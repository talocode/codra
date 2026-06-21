import chalk from 'chalk';
import type { SetupRecommendation, DetectedStack } from './types.js';

const TYPE_LABELS: Record<string, string> = {
  'node-typescript': 'Node/TypeScript',
  'nextjs': 'Next.js',
  'react-vite': 'React/Vite',
  'cli': 'CLI',
  'rust': 'Rust',
  'tauri': 'Tauri Desktop',
  'remotion-video': 'Remotion/Video',
  'monorepo': 'Monorepo',
  'unknown': 'Unknown'
};

export function formatAnalysis(stack: DetectedStack): string {
  const lines: string[] = [];
  lines.push(chalk.cyan('\n  Project Analysis:'));
  lines.push('');
  lines.push(chalk.gray('  Type:        ') + chalk.white(TYPE_LABELS[stack.projectType] || stack.projectType));
  lines.push(chalk.gray('  Package:     ') + chalk.white(stack.packageManager));
  lines.push(chalk.gray('  TypeScript:  ') + (stack.hasTypeScript ? chalk.green('yes') : chalk.gray('no')));
  lines.push(chalk.gray('  React:       ') + (stack.hasReact ? chalk.green('yes') : chalk.gray('no')));
  lines.push(chalk.gray('  Tests:       ') + (stack.hasTests ? chalk.green('yes') : chalk.gray('no')));
  lines.push(chalk.gray('  Lint:        ') + (stack.hasLint ? chalk.green('yes') : chalk.gray('no')));
  lines.push(chalk.gray('  Build:       ') + (stack.hasBuild ? chalk.green('yes') : chalk.gray('no')));
  lines.push(chalk.gray('  Docs:        ') + (stack.hasDocs ? chalk.green('yes') : chalk.gray('no')));
  lines.push(chalk.gray('  Workspaces:  ') + (stack.hasWorkspaces ? chalk.green('yes') : chalk.gray('no')));
  if (stack.detectedFrameworks.length > 0) {
    lines.push(chalk.gray('  Frameworks:  ') + chalk.white(stack.detectedFrameworks.join(', ')));
  }
  lines.push('');
  return lines.join('\n');
}

export function formatRecommendation(rec: SetupRecommendation): string {
  const lines: string[] = [];

  lines.push(chalk.cyan('  Setup Recommendations:'));
  lines.push(chalk.gray(`  Confidence: ${rec.confidence}%`));
  lines.push('');

  if (rec.recommendedSkills.length > 0) {
    lines.push(chalk.gray('  Recommended Skills:'));
    for (const skill of rec.recommendedSkills) {
      lines.push(chalk.gray('    - ') + chalk.white(skill));
    }
    lines.push('');
  }

  if (rec.recommendedCommands.length > 0) {
    lines.push(chalk.gray('  Recommended Commands:'));
    for (const cmd of rec.recommendedCommands) {
      lines.push(chalk.gray('    ') + chalk.white(cmd));
    }
    lines.push('');
  }

  if (rec.recommendedContextFiles.length > 0) {
    lines.push(chalk.gray('  Suggested Context Files:'));
    for (const f of rec.recommendedContextFiles) {
      lines.push(chalk.gray('    - ') + chalk.white(f));
    }
    lines.push('');
  }

  if (rec.recommendedValidation.length > 0) {
    lines.push(chalk.gray('  Validation Commands:'));
    for (const v of rec.recommendedValidation) {
      lines.push(chalk.gray('    ') + chalk.white(v));
    }
    lines.push('');
  }

  if (rec.recommendedPermissionLevel) {
    lines.push(chalk.gray('  Suggested Permission Level: ') + chalk.white(rec.recommendedPermissionLevel));
    lines.push('');
  }

  if (rec.risks.length > 0) {
    lines.push(chalk.yellow('  Risks:'));
    for (const r of rec.risks) {
      lines.push(chalk.yellow('    ⚠ ') + chalk.gray(r));
    }
    lines.push('');
  }

  if (rec.nextSteps.length > 0) {
    lines.push(chalk.gray('  Next Steps:'));
    for (let i = 0; i < rec.nextSteps.length; i++) {
      lines.push(chalk.gray(`    ${i + 1}. `) + chalk.white(rec.nextSteps[i]));
    }
    lines.push('');
  }

  return lines.join('\n');
}
