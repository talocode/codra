import chalk from 'chalk';

export function renderShortcuts(): string[] {
  const k = (key: string) => chalk.bgHex('#2d2d2d').white.bold(` ${key} `);
  const l = (text: string) => chalk.gray(text);

  return [
    '  ' + k('/') + l(' commands') + '   ' + k('tab') + l(' autocomplete') + '   ' + k('@') + l(' attach file') + '   ' + k('ctrl+c') + l(' exit'),
  ];
}
