export const DEFAULT_ACTIVITY_CONFIG = {
    enabled: true,
    mode: 'local',
    trackFiles: true,
    trackCommands: true,
    trackDurations: true,
    redactSecrets: true,
    ignoredFiles: ['.env', '.env.*', '*.pem', '*.key'],
    ignoredCommands: []
};
