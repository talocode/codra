const DEFAULT_CONFIG = {
    level: 'confirm-edits',
    allowedTools: [],
    ignoredFiles: ['.env', '.env.*', '*.pem', '*.key'],
    ignoredCommands: []
};
export function loadPermissionConfig() {
    const configPath = path.join(process.cwd(), '.codra', 'permissions.json');
    if (fs.existsSync(configPath)) {
        try {
            const content = fs.readFileSync(configPath, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
        }
        catch {
            return DEFAULT_CONFIG;
        }
    }
    return DEFAULT_CONFIG;
}
export function savePermissionConfig(config) {
    const configDir = path.join(process.cwd(), '.codra');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    const configPath = path.join(configDir, 'permissions.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
import * as fs from 'fs';
import * as path from 'path';
