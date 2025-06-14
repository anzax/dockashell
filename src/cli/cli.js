#!/usr/bin/env node
import { Command } from 'commander';
import { registerStatus } from './commands/status.js';
import { registerBuild } from './commands/build.js';
import { registerProjectCommands } from './commands/project.js';
import { registerLogs } from './commands/logs.js';
import { registerServe } from './commands/serve.js';
import { registerRemoteServe } from './commands/remote.js';
import { registerHelp } from './commands/help.js';
import { error as errorColor } from './utils/output.js';
import { getVersion } from '../utils/version.js';

process.on('uncaughtException', (err) => {
  console.error(errorColor(`Fatal error: ${err.message}`));
  process.exit(1);
});

const program = new Command();

program
  .name('dockashell')
  .version(getVersion())
  .description('AI agent secure Docker environments');

registerStatus(program);
registerBuild(program);
registerProjectCommands(program);
registerLogs(program);
registerServe(program);
registerRemoteServe(program);
registerHelp(program);

program.parse(process.argv);
