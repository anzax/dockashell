export function registerLogs(program) {
  program
    .command('logs')
    .description('Launch trace viewer (TUI)')
    .action(async () => {
      await import('../../tui/tui-launcher.js');
    });
}
