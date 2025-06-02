import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { error as errorColor } from '../utils/output.js';

export function registerLogs(program) {
  program
    .command('logs [project]')
    .description('Launch trace viewer (TUI)')
    .action(async (project) => {
      if (process.env.DS_SKIP_TUI) return;

      try {
        const __filename = fileURLToPath(import.meta.url);
        const tuiPath = path.join(
          path.dirname(__filename),
          '..',
          '..',
          'tui',
          'tui-launcher.js'
        );
        const args = [tuiPath];
        if (project) args.push(project);
        const child = spawn('node', args, { stdio: 'inherit' });
        child.on('error', (err) => {
          console.error(errorColor(`Error: ${err.message}`));
          process.exit(1);
        });
        child.on('exit', (code) => {
          process.exit(code ?? 0);
        });
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
