import * as fs from 'fs';
import * as path from 'path';
const SETUP_DIR = '.codra/setup';
function getSetupDir(cwd) {
    return path.join(cwd, SETUP_DIR);
}
export function saveSetupReport(report) {
    const dir = getSetupDir(report.cwd);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'latest.json'), JSON.stringify(report, null, 2));
    const md = formatReportMarkdown(report);
    fs.writeFileSync(path.join(dir, 'latest.md'), md);
}
export function loadSetupReport(cwd) {
    const p = path.join(getSetupDir(cwd), 'latest.json');
    if (!fs.existsSync(p))
        return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
    catch {
        return null;
    }
}
function formatReportMarkdown(report) {
    const lines = [];
    lines.push(`# Codra Setup Report`);
    lines.push('');
    lines.push(`Generated: ${report.analyzedAt}`);
    lines.push(`Project: ${report.cwd}`);
    lines.push('');
    lines.push('## Detected Stack');
    lines.push(`- Type: ${report.stack.projectType}`);
    lines.push(`- Package Manager: ${report.stack.packageManager}`);
    lines.push(`- TypeScript: ${report.stack.hasTypeScript}`);
    lines.push(`- React: ${report.stack.hasReact}`);
    lines.push(`- Tests: ${report.stack.hasTests}`);
    lines.push(`- Lint: ${report.stack.hasLint}`);
    lines.push(`- Build: ${report.stack.hasBuild}`);
    lines.push('');
    lines.push('## Recommendations');
    lines.push(`- Confidence: ${report.recommendation.confidence}%`);
    lines.push(`- Skills: ${report.recommendation.recommendedSkills.join(', ')}`);
    lines.push(`- Commands: ${report.recommendation.recommendedCommands.join(', ')}`);
    lines.push(`- Validation: ${report.recommendation.recommendedValidation.join(', ')}`);
    lines.push(`- Permission: ${report.recommendation.recommendedPermissionLevel}`);
    if (report.recommendation.risks.length > 0) {
        lines.push('');
        lines.push('## Risks');
        for (const r of report.recommendation.risks)
            lines.push(`- ${r}`);
    }
    if (report.recommendation.nextSteps.length > 0) {
        lines.push('');
        lines.push('## Next Steps');
        for (let i = 0; i < report.recommendation.nextSteps.length; i++) {
            lines.push(`${i + 1}. ${report.recommendation.nextSteps[i]}`);
        }
    }
    return lines.join('\n');
}
