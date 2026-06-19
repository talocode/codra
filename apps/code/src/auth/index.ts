import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

const AUTH_FILE = path.join(os.homedir(), '.codra', 'auth.json');
const TERA_BASE_URL = process.env.CODRA_AUTH_URL || 'https://teraai.chat';
const AUTH_DEV_BYPASS = process.env.CODRA_AUTH_DEV_BYPASS === '1';

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

export function getAuthFilePath(): string {
  return AUTH_FILE;
}

export function isAuthenticated(): boolean {
  if (AUTH_DEV_BYPASS) return true;
  if (authToken) return true;
  return fs.existsSync(AUTH_FILE);
}

export function getAuthToken(): AuthToken | null {
  if (AUTH_DEV_BYPASS) {
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
      authToken = JSON.parse(content);
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

  // Set permissions to 600 on Linux/macOS
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(AUTH_FILE, 0o600);
    } catch {
      // Ignore permission errors on some systems
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

export async function startLogin(): Promise<boolean> {
  console.log(chalk.cyan('\n  Codra Code Authentication'));
  console.log(chalk.gray('  Starting Tera login flow...\n'));

  try {
    // Generate device code
    const deviceCode = generateDeviceCode();
    const verificationUrl = `${TERA_BASE_URL}/auth/signin?source=codra-code&device_code=${deviceCode}&redirect_to=/codra-code/auth/success`;

    console.log(chalk.gray('  Opening browser for authentication...'));
    console.log(chalk.gray(`  If browser doesn't open, visit:\n`));
    console.log(chalk.cyan(`  ${verificationUrl}\n`));

    // Try to open browser
    await openBrowser(verificationUrl);

    console.log(chalk.gray('  Waiting for authentication...'));
    console.log(chalk.gray('  (Press Ctrl+C to cancel)\n'));

    // Poll for authentication
    const token = await pollForAuth(deviceCode);

    if (token) {
      await saveAuthToken(token);
      console.log(chalk.green('\n  ✓ Authenticated with Tera successfully!'));
      console.log(chalk.gray(`  Account: ${token.email}`));
      console.log(chalk.gray('  You can now use Codra Code.\n'));
      return true;
    }

    console.log(chalk.red('\n  ✗ Authentication failed or timed out.\n'));
    return false;

  } catch (error) {
    console.log(chalk.red(`\n  ✗ Login error: ${error}\n`));
    return false;
  }
}

function generateDeviceCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

  return new Promise((resolve) => {
    exec(command, () => resolve());
  });
}

async function pollForAuth(deviceCode: string): Promise<AuthToken | null> {
  const maxAttempts = 60; // 2 minutes with 2-second intervals
  const interval = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${TERA_BASE_URL}/api/codra/auth/device/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: deviceCode })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          return {
            userId: data.token.userId || data.userId,
            email: data.token.email || data.email,
            accessToken: data.token.accessToken || data.accessToken,
            refreshToken: data.token.refreshToken || data.refreshToken,
            expiresAt: data.token.expiresAt || data.expiresAt,
            createdAt: new Date().toISOString(),
            source: 'teraai.chat'
          };
        }
      }
    } catch {
      // Backend endpoint may not exist yet
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return null;
}

export async function authStatus(): Promise<void> {
  console.log(chalk.cyan('\n  Auth Status'));

  if (AUTH_DEV_BYPASS) {
    console.log(chalk.yellow('  Mode: Development bypass enabled'));
    console.log(chalk.gray('  Set CODRA_AUTH_DEV_BYPASS=0 to disable\n'));
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
      console.log(chalk.yellow('  Warning: Token may be expired'));
    }
    console.log(chalk.gray(`  Token: ${AUTH_FILE}`));
  } else {
    console.log(chalk.red('  Status: Not authenticated'));
    console.log(chalk.gray('  Run: codra-code login'));
  }
  console.log('');
}

export function requireAuth(): boolean {
  if (isAuthenticated()) return true;

  console.log(chalk.red('\n  Codra Code requires a Tera account.'));
  console.log(chalk.gray('  Run: codra-code login'));
  console.log(chalk.gray('  Sign in at: https://teraai.chat/auth/signin\n'));
  return false;
}
