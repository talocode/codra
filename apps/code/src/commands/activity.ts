import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { getEvents, getActivityConfig } from '../activity/store.js';

export async function activityCommand(args: string[]) {
  const subcommand = args[0] || 'summary';

  switch (subcommand) {
    case 'today': {
      const events = getEvents();
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.timestamp.startsWith(today));
      
      console.log(chalk.cyan('\n  Today\'s Activity:'));
      console.log(chalk.gray(`  Events: ${todayEvents.length}`));
      
      const commands = todayEvents.filter(e => e.type === 'command_run');
      console.log(chalk.gray(`  Commands: ${commands.length}`));
      
      const files = todayEvents.filter(e => e.type === 'file_inspected' || e.type === 'file_modified');
      console.log(chalk.gray(`  Files: ${files.length}`));
      
      console.log('');
      break;
    }

    case 'week': {
      const events = getEvents();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weekEvents = events.filter(e => e.timestamp > weekAgo);
      
      console.log(chalk.cyan('\n  This Week\'s Activity:'));
      console.log(chalk.gray(`  Events: ${weekEvents.length}`));
      
      const commands = weekEvents.filter(e => e.type === 'command_run');
      console.log(chalk.gray(`  Commands: ${commands.length}`));
      
      const files = weekEvents.filter(e => e.type === 'file_inspected' || e.type === 'file_modified');
      console.log(chalk.gray(`  Files: ${files.length}`));
      
      console.log('');
      break;
    }

    case 'summary': {
      const events = getEvents();
      const config = getActivityConfig();
      
      console.log(chalk.cyan('\n  Activity Summary:'));
      console.log(chalk.gray(`  Enabled: ${config.enabled}`));
      console.log(chalk.gray(`  Mode: ${config.mode}`));
      console.log(chalk.gray(`  Total Events: ${events.length}`));
      
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.timestamp.startsWith(today));
      console.log(chalk.gray(`  Today: ${todayEvents.length} events`));
      
      console.log('');
      break;
    }

    case 'files': {
      const events = getEvents();
      const fileEvents = events.filter(e => e.type === 'file_inspected' || e.type === 'file_modified');
      const uniqueFiles = [...new Set(fileEvents.map(e => e.file).filter(Boolean))];
      
      console.log(chalk.cyan('\n  Files Touched:'));
      if (uniqueFiles.length === 0) {
        console.log(chalk.gray('  No files touched yet.'));
      } else {
        uniqueFiles.forEach(f => console.log(chalk.gray(`  - ${f}`)));
      }
      console.log('');
      break;
    }

    case 'off': {
      const configPath = path.join(process.cwd(), '.codra', 'activity.json');
      const config = getActivityConfig();
      config.enabled = false;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green('\n  Activity tracking disabled.\n'));
      break;
    }

    case 'on': {
      const configPath = path.join(process.cwd(), '.codra', 'activity.json');
      const config = getActivityConfig();
      config.enabled = true;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green('\n  Activity tracking enabled.\n'));
      break;
    }

    case 'export': {
      const events = getEvents();
      const exportDir = path.join(process.cwd(), '.codra', 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const date = new Date().toISOString().split('T')[0];
      const exportPath = path.join(exportDir, `activity-${date}.md`);
      
      let content = `# Activity Export - ${date}\n\n`;
      content += `Total Events: ${events.length}\n\n`;
      
      const commands = events.filter(e => e.type === 'command_run');
      content += `## Commands (${commands.length})\n\n`;
      commands.forEach(e => {
        content += `- ${e.timestamp}: ${e.command || 'unknown'}\n`;
      });
      
      const files = events.filter(e => e.type === 'file_inspected' || e.type === 'file_modified');
      content += `\n## Files (${files.length})\n\n`;
      files.forEach(e => {
        content += `- ${e.timestamp}: ${e.file || 'unknown'}\n`;
      });
      
      fs.writeFileSync(exportPath, content);
      console.log(chalk.green(`\n  Activity exported to: ${exportPath}\n`));
      break;
    }

    default: {
      const events = getEvents();
      const config = getActivityConfig();
      
      console.log(chalk.cyan('\n  Activity Tracking:'));
      console.log(chalk.gray(`  Enabled: ${config.enabled}`));
      console.log(chalk.gray(`  Mode: ${config.mode}`));
      console.log(chalk.gray(`  Total Events: ${events.length}`));
      
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.timestamp.startsWith(today));
      console.log(chalk.gray(`  Today: ${todayEvents.length} events`));
      
      console.log('');
      break;
    }
  }
}
