import chalk from 'chalk';
import { getConfig } from '../config.js';
import { createProvider } from '../providers/index.js';
import { getAuthBaseUrl, isAuthenticated } from '../auth/index.js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function doctorCommand() {
  console.log(chalk.cyan('\n  Codra Code Doctor'));
  console.log(chalk.gray('  Checking system health...\n'));

  const config = getConfig();

  // Check provider
  console.log(chalk.cyan('  Provider Configuration:'));
  console.log(chalk.gray(`    Provider: ${config.provider}`));
  console.log(chalk.gray(`    Model: ${config.model}`));
  console.log(chalk.gray(`    API Key: ${config.apiKey ? '****' : 'Not set'}`));
  console.log(chalk.gray(`    Base URL: ${config.baseUrl || 'Default'}`));

  if (config.provider === 'mock') {
    console.log(chalk.yellow('    Status: Test mode (mock provider)'));
  } else if (!config.apiKey && config.provider !== 'ollama') {
    console.log(chalk.red('    Status: Missing API key'));
  } else {
    try {
      const provider = createProvider(config.provider, {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey
      });
      const available = await provider.isAvailable();
      console.log(chalk.gray(`    Status: ${available ? 'Available' : 'Unavailable'}`));
    } catch (e) {
      console.log(chalk.red('    Status: Error'));
    }
  }

  // Check project path
  console.log(chalk.cyan('\n  Project:'));
  console.log(chalk.gray(`    Path: ${process.cwd()}`));
  console.log(chalk.gray(`    Exists: ${fs.existsSync(process.cwd())}`));

  // Check sessions
  console.log(chalk.cyan('\n  Sessions:'));
  const sessionsDir = path.join(process.cwd(), '.codra/sessions');
  console.log(chalk.gray(`    Path: ${sessionsDir}`));
  console.log(chalk.gray(`    Exists: ${fs.existsSync(sessionsDir)}`));

  // Check git
  console.log(chalk.cyan('\n  Git:'));
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim();
    console.log(chalk.gray(`    Version: ${gitVersion}`));
    
    const isGitRepo = execSync('git rev-parse --is-inside-work-tree', { 
      encoding: 'utf-8',
      cwd: process.cwd()
    }).trim();
    console.log(chalk.gray(`    Repository: ${isGitRepo === 'true' ? 'Yes' : 'No'}`));
  } catch {
    console.log(chalk.gray('    Status: Not available'));
  }

  // Check MCP config
  console.log(chalk.cyan('\n  MCP:'));
  const mcpConfigPath = path.join(process.cwd(), '.codra/mcp.json');
  const userMcpConfigPath = path.join(os.homedir(), '.codra/mcp.json');
  console.log(chalk.gray(`    Project config: ${fs.existsSync(mcpConfigPath) ? 'Found' : 'Not found'}`));
  console.log(chalk.gray(`    User config: ${fs.existsSync(userMcpConfigPath) ? 'Found' : 'Not found'}`));

  // Check Tera API connectivity
  console.log(chalk.cyan('\n  Tera API:'));
  const teraBaseUrl = getAuthBaseUrl();
  console.log(chalk.gray(`    Base URL: ${teraBaseUrl}`));
  console.log(chalk.gray(`    Authenticated: ${isAuthenticated() ? 'Yes' : 'No'}`));

  try {
    const testUrl = `${teraBaseUrl}/api/codra/auth/device/start`;
    const testResponse = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cli_version: '0.1.6', platform: process.platform }),
      signal: AbortSignal.timeout(10000)
    });

    const contentType = testResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson && testResponse.ok) {
      console.log(chalk.green('    Login endpoint: Reachable (JSON)'));
    } else if (isJson && !testResponse.ok) {
      console.log(chalk.yellow(`    Login endpoint: Returns JSON but status ${testResponse.status}`));
    } else {
      console.log(chalk.red('    Login endpoint: Returns HTML instead of JSON'));
      console.log(chalk.red('    This usually means the API route is not deployed or is misconfigured.'));
      console.log(chalk.gray('    Try: codra-code login --no-browser'));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('timeout') || msg.includes('Timeout')) {
      console.log(chalk.yellow('    Login endpoint: Timed out (10s)'));
    } else {
      console.log(chalk.red(`    Login endpoint: Unreachable (${msg})`));
    }
  }

  // Check plugins
  console.log(chalk.cyan('\n  Plugins:'));
  const pluginsDir = path.join(process.cwd(), 'plugins');
  const codraPluginsDir = path.join(process.cwd(), '.codra/plugins');
  console.log(chalk.gray(`    Project plugins: ${fs.existsSync(pluginsDir) ? 'Found' : 'Not found'}`));
  console.log(chalk.gray(`    Codra plugins: ${fs.existsSync(codraPluginsDir) ? 'Found' : 'Not found'}`));

  // Check skills
  console.log(chalk.cyan('\n  Skills:'));
  const skillsDir = path.join(process.cwd(), 'skills');
  const codraSkillsDir = path.join(process.cwd(), '.codra/skills');
  console.log(chalk.gray(`    Project skills: ${fs.existsSync(skillsDir) ? 'Found' : 'Not found'}`));
  console.log(chalk.gray(`    Codra skills: ${fs.existsSync(codraSkillsDir) ? 'Found' : 'Not found'}`));

  console.log('');
}
