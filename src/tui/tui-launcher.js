#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './app.js';

const program = new Command();
program
  .name('dockashell-tui')
  .argument('[project]', 'Project name to open')
  .parse(process.argv);

const projectArg = program.args[0];

render(React.createElement(App, { projectArg }));
