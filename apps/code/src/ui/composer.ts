import chalk from 'chalk';
import { getConfig } from '../config.js';
import { getModeLabel } from '../providers/index.js';
import { loadPermissionConfig } from '../permissions/config.js';
import { execSync } from 'child_process';

const VERSION = '0.2.3';

export interface ComposerState {
  provider: string;
  model: string;
  mode: string;
  editPolicy: string;
  cols: number;
}

export function getComposerState(): ComposerState {
  const config = getConfig();
  const permConfig = loadPermissionConfig();
  return {
    provider: config.provider || 'no model selected',
    model: config.model || '',
    mode: getModeLabel(config.provider),
    editPolicy: permConfig.level || 'confirm-edits',
    cols: process.stdout.columns || 80,
  };
}

export function renderComposer(state?: ComposerState): void {
  const s = state || getComposerState();
  const cols = s.cols;
  const narrow = cols < 60;

  const lines: string[] = [];

  // Clear screen
  lines.push('\x1B[2J\x1B[H');

  if (!narrow) {
    lines.push('');
    lines.push('');
  }

  const title = 'codra-code';
  if (narrow) {
    lines.push(center(title, cols));
  } else {
    lines.push(center(chalk.hex('#ef6c2e').bold(title), cols));
  }

  if (!narrow) {
    lines.push(center(chalk.gray('Local-first coding agent by Talocode'), cols));
    lines.push('');
    lines.push('');
  }

  const boxWidth = Math.min(cols - 4, 64);
  const placeholder = narrow
    ? 'Ask Codra...'
    : 'Ask Codra to build, fix, review, test, or understand this repo...';

  const boxPad = Math.max(0, Math.floor((cols - boxWidth) / 2));
  const pad = ' '.repeat(boxPad);

  lines.push(pad + chalk.gray('┌' + '─'.repeat(boxWidth) + '┐'));

  const innerContent = ' ' + chalk.gray(placeholder) + ' '.repeat(Math.max(0, boxWidth - placeholder.length - 1));
  lines.push(pad + chalk.gray('│') + innerContent + chalk.gray('│'));

  lines.push(pad + chalk.gray('└' + '─'.repeat(boxWidth) + '┘'));

  if (!narrow) lines.push('');

  const modelDisplay = s.model ? `${s.provider}/${s.model}` : s.provider;
  const statusText = `Build · ${modelDisplay} · ${s.mode} · ${s.editPolicy}`;
  lines.push(center(chalk.gray(statusText), cols));

  if (!narrow) {
    lines.push('');

    const shortcuts = chalk.gray('/ commands    tab autocomplete    @ attach file soon    ctrl+c exit');
    lines.push(center(shortcuts, cols));

    lines.push('');
    lines.push('');
  }

  const cwd = process.cwd();
  let gitBranch = '';
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {}

  const footerPath = gitBranch ? `${cwd}:${gitBranch}` : cwd;
  const versionLine = `v${VERSION}`;

  if (!narrow) {
    const available = cols - footerPath.length - versionLine.length - 2;
    const footerSpacing = Math.max(2, available);
    lines.push(chalk.dim(footerPath) + ' '.repeat(footerSpacing) + chalk.dim(versionLine));
  } else {
    lines.push(chalk.dim(footerPath));
    lines.push(chalk.dim(versionLine));
  }

  if (!narrow) lines.push('');

  process.stdout.write(lines.join('\n') + '\n');
}

export function renderStatusLine(): string {
  const config = getConfig();
  const permConfig = loadPermissionConfig();
  const provider = config.provider || 'no model selected';
  const model = config.model || '';
  const mode = getModeLabel(config.provider);
  const editPolicy = permConfig.level || 'confirm-edits';
  const modelDisplay = model ? `${provider}/${model}` : provider;
  return `Build · ${modelDisplay} · ${mode} · ${editPolicy}`;
}

export function getFooterLine(): string {
  const cwd = process.cwd();
  let gitBranch = '';
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {}
  const footerPath = gitBranch ? `${cwd}:${gitBranch}` : cwd;
  return `${footerPath}  v${VERSION}`;
}

function center(text: string, totalWidth: number): string {
  const plain = text.replace(/\x1B\[[0-9;]*m/g, '');
  if (plain.length >= totalWidth) return text;
  return ' '.repeat(Math.floor((totalWidth - plain.length) / 2)) + text;
}
