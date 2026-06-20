import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_ACTIVITY_CONFIG } from './types.js';
const ACTIVITY_DIR = path.join(process.cwd(), '.codra', 'activity');
const EVENTS_FILE = path.join(ACTIVITY_DIR, 'events.jsonl');
const CONFIG_FILE = path.join(process.cwd(), '.codra', 'activity.json');
function ensureActivityDir() {
    if (!fs.existsSync(ACTIVITY_DIR)) {
        fs.mkdirSync(ACTIVITY_DIR, { recursive: true });
    }
}
function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return { ...DEFAULT_ACTIVITY_CONFIG, ...JSON.parse(content) };
        }
        catch {
            return DEFAULT_ACTIVITY_CONFIG;
        }
    }
    return DEFAULT_ACTIVITY_CONFIG;
}
function sanitizeContent(content) {
    const patterns = [
        /api[_-]?key\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
        /password\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
        /secret\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
    ];
    let sanitized = content;
    for (const pattern of patterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
}
export function trackEvent(event) {
    const config = loadConfig();
    if (!config.enabled)
        return;
    ensureActivityDir();
    const sanitizedEvent = {
        ...event,
        file: event.file ? sanitizeContent(event.file) : undefined,
        command: event.command ? sanitizeContent(event.command) : undefined
    };
    const line = JSON.stringify(sanitizedEvent) + '\n';
    fs.appendFileSync(EVENTS_FILE, line);
}
export function getEvents() {
    ensureActivityDir();
    if (!fs.existsSync(EVENTS_FILE))
        return [];
    const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    return lines.map(line => {
        try {
            return JSON.parse(line);
        }
        catch {
            return null;
        }
    }).filter((e) => e !== null);
}
export function getActivityConfig() {
    return loadConfig();
}
