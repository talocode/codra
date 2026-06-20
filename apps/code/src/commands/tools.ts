import chalk from 'chalk';
import { getToolCalls, getRecentToolCalls, getToolCallsByThread, clearToolCalls } from '../toolCalls/store.js';

export async function toolsCommand(args: string[]) {
  if (args.length === 0) {
    console.log(chalk.gray('\n  Usage: /tools log | /tools recent | /tools show <id> | /tools thread <threadId> | /tools clear\n'));
    return;
  }

  const subcommand = args[0];

  switch (subcommand) {
    case 'log':
    case 'recent': {
      const toolCalls = getRecentToolCalls(20);
      
      if (toolCalls.length === 0) {
        console.log(chalk.gray('\n  No tool calls logged yet.\n'));
        return;
      }
      
      console.log(chalk.cyan('\n  Recent Tool Calls:'));
      toolCalls.forEach(tc => {
        const statusIcon = tc.status === 'completed' ? '✓' : tc.status === 'failed' ? '✗' : '○';
        const riskColor = tc.riskLevel === 'high' ? chalk.red : tc.riskLevel === 'medium' ? chalk.yellow : chalk.gray;
        console.log(`    ${statusIcon} ${tc.tool} ${riskColor(`[${tc.riskLevel}]`)}`);
        console.log(chalk.gray(`      ${tc.inputSummary}`));
      });
      console.log('');
      break;
    }

    case 'show': {
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /tools show <id>\n'));
        return;
      }
      const toolCalls = getToolCalls();
      const tc = toolCalls.find(t => t.id === args[1]);
      if (tc) {
        console.log(chalk.cyan('\n  Tool Call Details:'));
        console.log(chalk.gray(`  ID: ${tc.id}`));
        console.log(chalk.gray(`  Tool: ${tc.tool}`));
        console.log(chalk.gray(`  Category: ${tc.category}`));
        console.log(chalk.gray(`  Status: ${tc.status}`));
        console.log(chalk.gray(`  Risk: ${tc.riskLevel}`));
        console.log(chalk.gray(`  Started: ${tc.startedAt}`));
        if (tc.endedAt) console.log(chalk.gray(`  Ended: ${tc.endedAt}`));
        if (tc.durationMs) console.log(chalk.gray(`  Duration: ${tc.durationMs}ms`));
        if (tc.error) console.log(chalk.gray(`  Error: ${tc.error}`));
        console.log('');
      } else {
        console.log(chalk.red(`\n  Tool call not found: ${args[1]}\n`));
      }
      break;
    }

    case 'thread': {
      if (args.length < 2) {
        console.log(chalk.red('\n  Usage: /tools thread <threadId>\n'));
        return;
      }
      const threadCalls = getToolCallsByThread(args[1]);
      
      if (threadCalls.length === 0) {
        console.log(chalk.gray(`\n  No tool calls for thread: ${args[1]}\n`));
        return;
      }
      
      console.log(chalk.cyan(`\n  Tool Calls for Thread ${args[1]}:`));
      threadCalls.forEach(tc => {
        const statusIcon = tc.status === 'completed' ? '✓' : tc.status === 'failed' ? '✗' : '○';
        console.log(`    ${statusIcon} ${tc.tool} - ${tc.inputSummary}`);
      });
      console.log('');
      break;
    }

    case 'clear': {
      clearToolCalls();
      console.log(chalk.green('\n  Tool call logs cleared.\n'));
      break;
    }

    default:
      console.log(chalk.gray('\n  Usage: /tools log | /tools recent | /tools show <id> | /tools thread <threadId> | /tools clear\n'));
      break;
  }
}
