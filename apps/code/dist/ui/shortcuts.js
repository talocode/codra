import chalk from 'chalk';
export function renderShortcuts() {
    const k = (key) => chalk.bgHex('#2d2d2d').white.bold(` ${key} `);
    const l = (text) => chalk.gray(text);
    return [
        '  ' + k('/') + l(' commands') + '   ' + k('tab') + l(' autocomplete') + '   ' + k('@') + l(' attach file') + '   ' + k('ctrl+c') + l(' exit'),
    ];
}
