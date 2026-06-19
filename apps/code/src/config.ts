import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PROJECT_CONFIG = '.codra/config.json';
const USER_CONFIG = path.join(os.homedir(), '.codra/config.json');

export interface Config {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  mockMode: boolean;
}

let config: Config = {
  provider: process.env.CODRA_PROVIDER || 'mock',
  model: process.env.CODRA_MODEL || 'gpt-4o-mini',
  apiKey: process.env.CODRA_API_KEY || '',
  baseUrl: process.env.CODRA_BASE_URL || '',
  mockMode: process.env.CODRA_PROVIDER === 'mock' || !process.env.CODRA_API_KEY
};

export async function loadConfig(): Promise<Config> {
  try {
    if (fs.existsSync(USER_CONFIG)) {
      const userConf = JSON.parse(fs.readFileSync(USER_CONFIG, 'utf-8'));
      config = { ...config, ...userConf };
    }
    if (fs.existsSync(PROJECT_CONFIG)) {
      const projectConf = JSON.parse(fs.readFileSync(PROJECT_CONFIG, 'utf-8'));
      config = { ...config, ...projectConf };
    }

    if (process.argv.includes('--mock')) {
      config.mockMode = true;
      config.provider = 'mock';
    }

    if (config.provider === 'mock' || !config.apiKey) {
      config.mockMode = true;
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }

  return config;
}

export function getConfig(): Config {
  return config;
}

export function updateConfig(updates: Partial<Config>): void {
  config = { ...config, ...updates };
}

export function isSecretsFile(filePath: string): boolean {
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
