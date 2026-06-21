import chalk from 'chalk';
import { saveThread, getThread, listThreads } from '../threads/store.js';
import { getConfig } from '../config.js';
import { getActiveSkills } from '../skills/active.js';
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
export async function threadCommand(args) {
    if (args.length === 0) {
        console.log(chalk.gray('\n  Usage: /thread new <title> | /thread show <id> | /thread resume <id> | /thread rename <id> <title> | /thread export <id>\n'));
        return;
    }
    const subcommand = args[0];
    switch (subcommand) {
        case 'new':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /thread new <title>\n'));
                return;
            }
            const title = args.slice(1).join(' ');
            const config = getConfig();
            const activeSkills = getActiveSkills();
            const thread = {
                id: generateId(),
                title,
                projectPath: process.cwd(),
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messageCount: 0,
                toolCallCount: 0,
                activeProvider: config.provider,
                activeModel: config.model,
                activeSkill: activeSkills.length > 0 ? activeSkills[0].name : null,
                linkedPlanId: null,
                loadedInstructionFiles: []
            };
            saveThread(thread);
            console.log(chalk.green(`\n  Thread created: ${thread.id}`));
            console.log(chalk.gray(`  Title: ${title}\n`));
            break;
        case 'show':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /thread show <id>\n'));
                return;
            }
            const showThread = getThread(args[1]);
            if (showThread) {
                console.log(chalk.cyan(`\n  Thread: ${showThread.title}`));
                console.log(chalk.gray(`  ID: ${showThread.id}`));
                console.log(chalk.gray(`  Status: ${showThread.status}`));
                console.log(chalk.gray(`  Messages: ${showThread.messageCount}`));
                console.log(chalk.gray(`  Tool Calls: ${showThread.toolCallCount}`));
                console.log(chalk.gray(`  Provider: ${showThread.activeProvider} / ${showThread.activeModel}`));
                if (showThread.activeSkill) {
                    console.log(chalk.gray(`  Skill: ${showThread.activeSkill}`));
                }
                console.log('');
            }
            else {
                console.log(chalk.red(`\n  Thread not found: ${args[1]}\n`));
            }
            break;
        case 'resume':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /thread resume <id>\n'));
                return;
            }
            const resumeThread = getThread(args[1]);
            if (resumeThread) {
                resumeThread.updatedAt = new Date().toISOString();
                saveThread(resumeThread);
                console.log(chalk.green(`\n  Thread resumed: ${resumeThread.title}\n`));
            }
            else {
                console.log(chalk.red(`\n  Thread not found: ${args[1]}\n`));
            }
            break;
        case 'rename':
            if (args.length < 3) {
                console.log(chalk.red('\n  Usage: /thread rename <id> <title>\n'));
                return;
            }
            const renameThread = getThread(args[1]);
            if (renameThread) {
                renameThread.title = args.slice(2).join(' ');
                renameThread.updatedAt = new Date().toISOString();
                saveThread(renameThread);
                console.log(chalk.green(`\n  Thread renamed: ${renameThread.title}\n`));
            }
            else {
                console.log(chalk.red(`\n  Thread not found: ${args[1]}\n`));
            }
            break;
        case 'export':
            if (args.length < 2) {
                console.log(chalk.red('\n  Usage: /thread export <id>\n'));
                return;
            }
            const exportThread = getThread(args[1]);
            if (exportThread) {
                console.log(chalk.cyan(`\n  Thread Export: ${exportThread.title}`));
                console.log(chalk.gray(`  ID: ${exportThread.id}`));
                console.log(chalk.gray(`  Messages: ${exportThread.messageCount}`));
                console.log(chalk.gray(`  Tool Calls: ${exportThread.toolCallCount}`));
                console.log('');
            }
            else {
                console.log(chalk.red(`\n  Thread not found: ${args[1]}\n`));
            }
            break;
        default:
            console.log(chalk.gray('\n  Usage: /thread new <title> | /thread show <id> | /thread resume <id> | /thread rename <id> <title> | /thread export <id>\n'));
            break;
    }
}
export async function threadsCommand() {
    const threads = listThreads();
    if (threads.length === 0) {
        console.log(chalk.gray('\n  No threads found. Create one with: /thread new <title>\n'));
        return;
    }
    console.log(chalk.cyan('\n  Threads:'));
    threads.forEach(thread => {
        const statusColor = thread.status === 'active' ? chalk.green : chalk.gray;
        console.log(`    ${statusColor(thread.status.padEnd(10))} ${thread.id} - ${thread.title}`);
    });
    console.log('');
}
