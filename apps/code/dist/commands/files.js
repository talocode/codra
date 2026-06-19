import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
export async function filesCommand() {
    console.log(chalk.cyan('\n  Project Files:'));
    const ignore = ['.git', 'node_modules', '.codra'];
    function listDir(dir, prefix = '') {
        const items = fs.readdirSync(dir).filter(i => !ignore.includes(i));
        items.forEach((item, index) => {
            const isLast = index === items.length - 1;
            const itemPath = path.join(dir, item);
            const stats = fs.statSync(itemPath);
            console.log(`${prefix}${isLast ? '└── ' : '├── '}${item}${stats.isDirectory() ? '/' : ''}`);
            if (stats.isDirectory()) {
                listDir(itemPath, prefix + (isLast ? '    ' : '│   '));
            }
        });
    }
    listDir(process.cwd());
    console.log('');
}
