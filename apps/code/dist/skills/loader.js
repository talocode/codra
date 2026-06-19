import * as fs from 'fs';
import * as path from 'path';
const SKILL_DIRS = [
    path.join(process.cwd(), 'skills'),
    path.join(process.cwd(), '.codra/skills'),
    path.join(require('os').homedir(), '.codra/skills')
];
export async function loadSkill(name) {
    for (const dir of SKILL_DIRS) {
        const skillDir = path.join(dir, name);
        const skillFile = path.join(skillDir, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
            try {
                return fs.readFileSync(skillFile, 'utf-8');
            }
            catch {
                continue;
            }
        }
    }
    return null;
}
export async function listSkills() {
    const skills = [];
    for (const dir of SKILL_DIRS) {
        if (!fs.existsSync(dir))
            continue;
        const items = fs.readdirSync(dir).filter(f => {
            const skillFile = path.join(dir, f, 'SKILL.md');
            return fs.existsSync(skillFile);
        });
        skills.push(...items);
    }
    return [...new Set(skills)];
}
