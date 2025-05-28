#!/usr/bin/env node
import React, { useState } from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { ProjectSelector } from './views/project-selector/ProjectSelector.js';
import { LogViewer } from './views/log-viewer/LogViewer.js';
import { loadConfig } from '../utils/config.js';

const program = new Command();
program
  .name('dockashell-tui')
  .argument('[project]', 'Project name to open')
  .parse(process.argv);

const projectArg = program.args[0];

const defaultTuiConfig = {
  display: {
    max_entries: 100,
  },
};

const App = () => {
  const [project, setProject] = useState(projectArg || null);
  const [config, setConfig] = useState({ tui: defaultTuiConfig });

  React.useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(() => {
        // Keep default config on error
      });
  }, []);

  if (!project) {
    return React.createElement(ProjectSelector, {
      onSelect: setProject,
      onExit: () => process.exit(0),
    });
  }

  return React.createElement(LogViewer, {
    project,
    config: config.tui || defaultTuiConfig,
    onBack: () => setProject(null),
    onExit: () => process.exit(0),
  });
};

render(React.createElement(App));
