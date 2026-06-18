import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const PROJECT_CONFIG = '.codra/config.json';
const USER_CONFIG = path.join(os.homedir(), '.codra/config.json');

let config = {
  provider: process.env.CODRA_PROVIDER || 'openai',
  model: process.env.CODRA_MODEL || 'gpt-4',
  apiKey: process.env.CODRA_API_KEY || '',
  baseUrl: process.env.CODRA_BASE_URL || ''
};

export async function loadConfig() {
  try {
    if (fs.existsSync(USER_CONFIG)) {
      const userConf = JSON.parse(fs.readFileSync(USER_CONFIG, 'utf-8'));
      config = { ...config, ...userConf };
    }
    if (fs.existsSync(PROJECT_CONFIG)) {
      const projectConf = JSON.parse(fs.readFileSync(PROJECT_CONFIG, 'utf-8'));
      config = { ...config, ...projectConf };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
}

export function getConfig() {
  return config;
}

export function updateConfig(updates: Partial<typeof config>) {
  config = { ...config, ...updates };
  // In a real implementation, we'd persist this to a file
}
