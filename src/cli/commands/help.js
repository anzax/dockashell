export function registerHelp(program) {
  program
    .command('help [command]')
    .description('Show help for command')
    .action((cmd) => {
      if (cmd) {
        const sub = program.commands.find((c) => c.name() === cmd);
        if (sub) sub.help();
        else console.log(`Unknown command: ${cmd}`);
      } else {
        program.help();
      }
    });
}
