#!/usr/bin/env node
import React, { useState } from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { ProjectSelector } from './tui/ProjectSelector.js';
import { LogViewer } from './tui/LogViewer.js';
import { loadConfig } from './config.js';

const program = new Command();
program
  .name('dockashell-tui')
  .argument('[project]', 'Project name to open')
  .parse(process.argv);

const projectArg = program.args[0];

const App = () => {
  const [project, setProject] = useState(projectArg || null);
  const [config, setConfig] = useState(null);

  React.useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  if (!config) return null;

  if (!project) {
    return React.createElement(ProjectSelector, {
      onSelect: setProject,
      onExit: () => process.exit(0),
    });
  }

  return React.createElement(LogViewer, {
    project,
    config: config.tui || {
      display: { max_lines_per_entry: 5, max_entries: 100 },
    },
    onBack: () => setProject(null),
    onExit: () => process.exit(0),
  });
};

render(React.createElement(App));
