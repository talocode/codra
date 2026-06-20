import chalk from 'chalk';
export function formatVisualPlanMarkdown(plan) {
    const lines = [];
    lines.push(`# ${plan.title}`);
    lines.push('');
    lines.push(`**Status:** ${plan.status}`);
    lines.push(`**Created:** ${plan.createdAt}`);
    lines.push(`**Project:** ${plan.projectPath}`);
    if (plan.planId)
        lines.push(`**Linked Plan:** ${plan.planId}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(plan.summary);
    lines.push('');
    lines.push('## Sections');
    plan.sections.forEach(section => {
        lines.push(`### ${section.title}`);
        lines.push(`**Type:** ${section.type} | **Priority:** ${section.priority}`);
        lines.push('');
        lines.push(section.content);
        lines.push('');
    });
    if (plan.files.length > 0) {
        lines.push('## File Impact');
        lines.push('| Path | Action | Risk | Reason |');
        lines.push('|------|--------|------|--------|');
        plan.files.forEach(f => {
            lines.push(`| ${f.path} | ${f.action} | ${f.riskLevel} | ${f.reason} |`);
        });
        lines.push('');
    }
    if (plan.risks.length > 0) {
        lines.push('## Risks');
        plan.risks.forEach(r => lines.push(`- ${r}`));
        lines.push('');
    }
    if (plan.validation.length > 0) {
        lines.push('## Validation');
        plan.validation.forEach(v => lines.push(`- [ ] ${v}`));
        lines.push('');
    }
    if (plan.reviewQuestions.length > 0) {
        lines.push('## Review Questions');
        plan.reviewQuestions.forEach(q => lines.push(`- ${q}`));
        lines.push('');
    }
    lines.push('## Approval');
    lines.push(`**Status:** ${plan.approval.status}`);
    if (plan.approval.notes)
        lines.push(`**Notes:** ${plan.approval.notes}`);
    lines.push('');
    return lines.join('\n');
}
export function formatVisualPlanConsole(plan) {
    const lines = [];
    lines.push(chalk.cyan(`\n  Visual Plan: ${plan.title}`));
    lines.push(chalk.gray(`  ID: ${plan.id}`));
    lines.push(chalk.gray(`  Status: ${plan.status}`));
    if (plan.planId)
        lines.push(chalk.gray(`  Plan: ${plan.planId}`));
    lines.push('');
    lines.push(chalk.cyan('  Summary:'));
    lines.push(chalk.gray(`  ${plan.summary}`));
    lines.push('');
    lines.push(chalk.cyan('  Sections:'));
    plan.sections.forEach(s => {
        lines.push(chalk.gray(`    - ${s.title} [${s.type}]`));
    });
    lines.push('');
    if (plan.files.length > 0) {
        lines.push(chalk.cyan('  Files:'));
        plan.files.forEach(f => {
            lines.push(chalk.gray(`    - ${f.action}: ${f.path} [${f.riskLevel}]`));
        });
        lines.push('');
    }
    if (plan.risks.length > 0) {
        lines.push(chalk.yellow('  Risks:'));
        plan.risks.forEach(r => lines.push(chalk.gray(`    - ${r}`)));
        lines.push('');
    }
    lines.push(chalk.cyan('  Approval:'));
    lines.push(chalk.gray(`  Status: ${plan.approval.status}`));
    lines.push('');
    return lines.join('\n');
}
