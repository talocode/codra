import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
const DEFAULT_CONFIG = {
    paths: ['.codra/skills', '~/.codra/skills', '~/projects/talocode-skills/skills'],
    active: [],
    autoRecommend: true,
    maxActiveSkills: 3,
    maxSkillContextChars: 12000
};
function expandTilde(p) {
    if (p.startsWith('~')) {
        return path.join(os.homedir(), p.slice(1));
    }
    return p;
}
export function loadSkillsConfig() {
    const projectConfig = path.join(process.cwd(), '.codra', 'skills.json');
    if (fs.existsSync(projectConfig)) {
        try {
            const raw = fs.readFileSync(projectConfig, 'utf-8');
            const parsed = JSON.parse(raw);
            return { ...DEFAULT_CONFIG, ...parsed };
        }
        catch {
            return { ...DEFAULT_CONFIG };
        }
    }
    return { ...DEFAULT_CONFIG };
}
export function saveSkillsConfig(config) {
    const codraDir = path.join(process.cwd(), '.codra');
    if (!fs.existsSync(codraDir)) {
        fs.mkdirSync(codraDir, { recursive: true });
    }
    const configPath = path.join(codraDir, 'skills.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
export function getAllSkillPaths() {
    const config = loadSkillsConfig();
    const projectDir = process.cwd();
    return config.paths.map(p => expandTilde(p)).map(p => {
        if (!path.isAbsolute(p)) {
            return path.join(projectDir, p);
        }
        return p;
    });
}
