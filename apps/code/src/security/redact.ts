const SECRET_PATTERNS = [
  // API keys
  /api[_-]?key\s*[=:]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/gi,
  /apikey\s*[=:]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/gi,
  
  // Bearer tokens
  /bearer\s+[A-Za-z0-9_\-\.]{20,}/gi,
  
  // GitHub tokens
  /ghp_[A-Za-z0-9_]{36,}/g,
  /gho_[A-Za-z0-9_]{36,}/g,
  /github_pat_[A-Za-z0-9_]{80,}/g,
  
  // OpenAI keys
  /sk-[A-Za-z0-9]{48,}/g,
  
  // Anthropic keys
  /sk-ant-[A-Za-z0-9]{40,}/g,
  
  // Supabase keys
  /eyJ[A-Za-z0-9_\-]{100,}/g,
  
  // Passwords
  /password\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
  
  // Private keys
  /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/g,
  
  // Auth headers
  /authorization:\s*[Bb]earer\s+[^\s]+/gi,
  
  // .env values
  /^[A-Z_]+=[^\s]+$/gm,
];

export function redactSecrets(content: string): string {
  let redacted = content;
  
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  
  return redacted;
}

export function redactFilePath(filePath: string): boolean {
  const secretPatterns = [
    /\.env$/,
    /\.env\.\w+$/,
    /\.npmrc$/,
    /\.pem$/,
    /\.key$/,
    /id_rsa/,
    /id_ed25519/,
    /credentials/,
    /secret/,
    /\.git\/credentials/,
    /\.ssh\//,
  ];

  const basename = path.basename(filePath).toLowerCase();
  return secretPatterns.some(pattern => pattern.test(basename) || pattern.test(filePath));
}

import * as path from 'path';
