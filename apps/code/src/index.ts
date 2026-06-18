import { Command } from 'commander';
import { startRepl } from './repl';
import { loadConfig } from './config';

const program = new Command();

program
  .name('codra-code')
  .description('Codra Code: A local-first, open-source coding agent interface')
  .version('0.1.0');

program
  .command('start')
  .description('Start the Codra Code interface')
  .action(async () => {
    await loadConfig();
    startRepl();
  });

program.parse(process.argv);
