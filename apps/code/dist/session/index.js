import * as fs from 'fs';
import * as path from 'path';
const SESSIONS_DIR = path.join(process.cwd(), '.codra/sessions');
function ensureSessionsDir() {
    if (!fs.existsSync(SESSIONS_DIR)) {
        fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
}
function generateSessionId() {
    const now = new Date();
    return `session-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}
function sanitizeContent(content) {
    const sensitivePatterns = [
        /api[_-]?key\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
        /password\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
        /secret\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
        /token\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
        /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/gi,
    ];
    let sanitized = content;
    for (const pattern of sensitivePatterns) {
        sanitized = sanitized.replace(pattern, (match) => {
            const eqIndex = match.search(/[=:]/);
            if (eqIndex !== -1) {
                return match.substring(0, eqIndex + 1) + ' [REDACTED]';
            }
            return '[REDACTED]';
        });
    }
    return sanitized;
}
export function createSession() {
    ensureSessionsDir();
    const id = generateSessionId();
    const filePath = path.join(SESSIONS_DIR, `${id}.jsonl`);
    return {
        id,
        startTime: new Date().toISOString(),
        entries: [],
        filePath
    };
}
export function saveSessionEntry(session, entry) {
    ensureSessionsDir();
    const sanitizedEntry = {
        ...entry,
        content: sanitizeContent(entry.content)
    };
    const line = JSON.stringify(sanitizedEntry) + '\n';
    fs.appendFileSync(session.filePath, line, 'utf-8');
}
export function loadSession(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    return lines.map(line => {
        try {
            return JSON.parse(line);
        }
        catch {
            return null;
        }
    }).filter((entry) => entry !== null);
}
export function listSessions() {
    ensureSessionsDir();
    return fs.readdirSync(SESSIONS_DIR)
        .filter(file => file.endsWith('.jsonl'))
        .sort()
        .reverse();
}
export function getSessionPath(sessionId) {
    return path.join(SESSIONS_DIR, `${sessionId}.jsonl`);
}
export function messagesToSessionEntries(messages, provider, model) {
    return messages.map(msg => ({
        timestamp: new Date().toISOString(),
        role: msg.role,
        content: msg.content,
        provider,
        model
    }));
}
