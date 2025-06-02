#!/usr/bin/env node
import { Command } from 'commander';
import { registerStatus } from './commands/status.js';
import { registerBuild } from './commands/build.js';
import { registerProjectCommands } from './commands/project.js';
import { registerLogs } from './commands/logs.js';
import { registerServe } from './commands/serve.js';
import { registerHelp } from './commands/help.js';

const program = new Command();

program
  .name('dockashell')
  .version('0.1.0')
  .description('AI agent secure Docker environments');

registerStatus(program);
registerBuild(program);
registerProjectCommands(program);
registerLogs(program);
registerServe(program);
registerHelp(program);

program.parse(process.argv);
