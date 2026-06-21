import chalk from 'chalk';

export const theme = {
  accent: chalk.hex('#ef6c2e'),
  accentDim: chalk.hex('#c45a22'),
  white: chalk.white,
  bold: chalk.bold.white,
  gray: chalk.gray,
  dim: chalk.dim.gray,
  green: chalk.green,
  cyan: chalk.cyan,
  yellow: chalk.yellow,
  red: chalk.red,
  muted: chalk.hex('#6b7280'),

  border: {
    top: (w: number) => chalk.gray('─'.repeat(w)),
    frame: (content: string) => chalk.gray('│ ') + content + chalk.gray(' │'),
  },

  section: (label: string, value: string) =>
    chalk.gray('  ') + chalk.hex('#6b7280')(label.padEnd(14)) + chalk.white(value),

  shortcut: (key: string, label: string) =>
    chalk.gray('  ') + chalk.bgHex('#374151').white(` ${key} `) + chalk.gray(` ${label}`),
};
