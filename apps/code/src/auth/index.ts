import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

const AUTH_FILE = path.join(os.homedir(), '.codra', 'auth.json');
const DEFAULT_AUTH_URL = 'https://teraai.chat';
const AUTH_DEV_BYPASS = process.env.CODRA_AUTH_DEV_BYPASS === '1';
const ALLOW_DEV_BYPASS = process.env.CODRA_ALLOW_DEV_BYPASS === '1' || process.env.NODE_ENV !== 'production';

export interface AuthToken {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
  source: string;
}

let authToken: AuthToken | null = null;

export function getAuthBaseUrl(): string {
  return process.env.CODRA_AUTH_BASE_URL || 
         process.env.TERA_AUTH_BASE_URL || 
         DEFAULT_AUTH_URL;
}

export function getAuthFilePath(): string {
  return AUTH_FILE;
}

export function isAuthenticated(): boolean {
  if (AUTH_DEV_BYPASS && ALLOW_DEV_BYPASS) return true;
  if (authToken) return true;
  return fs.existsSync(AUTH_FILE);
}

export function getAuthToken(): AuthToken | null {
  if (AUTH_DEV_BYPASS && ALLOW_DEV_BYPASS) {
    return {
      userId: 'dev-user',
      email: 'dev@codra.local',
      accessToken: 'dev-token',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      source: 'teraai.chat'
    };
  }

  if (authToken) return authToken;

  if (fs.existsSync(AUTH_FILE)) {
    try {
      const content = fs.readFileSync(AUTH_FILE, 'utf-8');
      const token = JSON.parse(content);
      
      if (new Date(token.expiresAt) < new Date()) {
        console.log(chalk.yellow('  Warning: Auth token has expired. Please run: codra login'));
        return null;
      }
      
      authToken = token;
      return authToken;
    } catch {
      return null;
    }
  }

  return null;
}

export async function saveAuthToken(token: AuthToken): Promise<void> {
  const codraDir = path.join(os.homedir(), '.codra');
  if (!fs.existsSync(codraDir)) {
    fs.mkdirSync(codraDir, { recursive: true });
  }

  fs.writeFileSync(AUTH_FILE, JSON.stringify(token, null, 2));

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(AUTH_FILE, 0o600);
    } catch {
      // Ignore
    }
  }

  authToken = token;
}

export async function clearAuthToken(): Promise<void> {
  if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
  }
  authToken = null;
}

export async function startLogin(options: { noBrowser?: boolean; authUrl?: string } = {}): Promise<boolean> {
  const authBaseUrl = options.authUrl || getAuthBaseUrl();
  
  console.log(chalk.cyan('\n  Codra Code Authentication'));
  console.log(chalk.gray('  Starting Tera login flow...\n'));

  try {
    const startResponse = await fetch(`${authBaseUrl}/api/codra/auth/device/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cli_version: '0.4.0',
        platform: process.platform
      })
    });

    if (!startResponse.ok) {
      const error = await startResponse.text();
      throw new Error(`Failed to start auth session: ${error}`);
    }

    const startData = await startResponse.json();
    const { device_code, user_code, verification_url, expires_at, interval } = startData;

    console.log(chalk.gray('  Device Code:'), chalk.white(user_code));
    console.log(chalk.gray('  Expires:'), chalk.white(new Date(expires_at).toLocaleTimeString()));
    console.log('');

    if (options.noBrowser) {
      console.log(chalk.gray('  Open this URL in your browser:\n'));
      console.log(chalk.cyan(`  ${verification_url}\n`));
    } else {
      console.log(chalk.gray('  Opening browser for authentication...'));
      console.log(chalk.gray('  If browser doesn\'t open, visit:\n'));
      console.log(chalk.cyan(`  ${verification_url}\n`));
      await openBrowser(verification_url);
    }

    console.log(chalk.gray('  Waiting for authentication...'));
    console.log(chalk.gray('  (Press Ctrl+C to cancel)\n'));

    const token = await pollForAuth(device_code, authBaseUrl, interval || 2);

    if (token) {
      await saveAuthToken(token);
      console.log(chalk.green('\n  ✓ Authenticated with Tera successfully!'));
      console.log(chalk.gray(`  Account: ${token.email}`));
      console.log(chalk.gray('  You can now use Codra Code for hosted features.\n'));
      return true;
    }

    console.log(chalk.red('\n  ✗ Authentication failed or timed out.\n'));
    return false;

  } catch (error) {
    console.log(chalk.red(`\n  ✗ Login error: ${error}\n`));
    return false;
  }
}

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import('child_process');
  const platform = process.platform;
  let command: string;
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}" || echo "Could not open browser"`;
  }
  return new Promise((resolve) => { exec(command, () => resolve()); });
}

async function pollForAuth(deviceCode: string, authBaseUrl: string, interval: number): Promise<AuthToken | null> {
  const maxAttempts = 150;
  const pollInterval = interval * 1000;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${authBaseUrl}/api/codra/auth/device/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: deviceCode })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'approved' && data.token) {
          return {
            userId: data.user_id || data.userId,
            email: data.email,
            accessToken: data.token,
            expiresAt: data.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            source: 'teraai.chat'
          };
        } else if (data.status === 'expired') {
          console.log(chalk.red('  Session expired. Please try again.'));
          return null;
        } else if (data.status === 'denied') {
          console.log(chalk.red('  Authentication denied.'));
          return null;
        }
      }
    } catch {
      // safe placeholder, backend may not be live yet
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  return null;
}

export async function authStatus(): Promise<void> {
  console.log(chalk.cyan('\n  Auth Status'));

  if (AUTH_DEV_BYPASS && ALLOW_DEV_BYPASS) {
    console.log(chalk.yellow('  Mode: Development bypass active'));
    console.log(chalk.gray('  Set CODRA_AUTH_DEV_BYPASS=*** to disable\n'));
    return;
  }

  const token = getAuthToken();

  if (token) {
    const expiresDate = new Date(token.expiresAt);
    const isExpired = expiresDate < new Date();

    console.log(chalk.green('  Status: Authenticated'));
    console.log(chalk.gray(`  Account: ${token.email}`));
    console.log(chalk.gray(`  Expires: ${expiresDate.toLocaleDateString()}`));
    if (isExpired) {
      console.log(chalk.yellow('  Warning: Token has expired. Run: codra login'));
    }
    console.log(chalk.gray(`  Hosted usage: available (Tera/Talocode account)`));
    console.log(chalk.gray(`  Token file: ${AUTH_FILE} (contents never printed)`));
  } else {
    console.log(chalk.red('  Status: Not authenticated'));
    console.log(chalk.gray('  Run: codra login'));
    console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin'));
    console.log(chalk.gray('  Hosted usage: blocked for hosted providers'));
    console.log(chalk.gray('  Local mode (mock, ollama): works without auth'));
  }
  console.log('');
}

export function requireAuth(): boolean {
  if (isAuthenticated()) return true;

  console.log(chalk.red('\n  Codra Code requires a Tera account for hosted features.'));
  console.log(chalk.gray('  Run: codra login'));
  console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin\n'));
  return false;
}
