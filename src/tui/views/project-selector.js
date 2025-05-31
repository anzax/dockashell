import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { AppContainer } from '../components/app-container.js';
import { SHORTCUTS, buildFooter } from '../ui-utils/constants.js';
import { isBackKey } from '../ui-utils/text-utils.js';
import { discoverProjects } from '../ui-utils/project-discovery.js';
import { setActiveProject } from '../stores/project-store.js';

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState([]);

  useInput((input, key) => {
    if (isBackKey(input, key)) {
      onExit();
    }
  });

  useEffect(() => {
    discoverProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, []);

  const options =
    projects.length > 0
      ? projects.map((p) => ({
          label:
            p.name +
            (p.last
              ? ` - ${new Date(p.last).toLocaleString()}`
              : ' - no traces yet'),
          value: p.name,
        }))
      : [];

  return React.createElement(AppContainer, {
    header: React.createElement(
      Text,
      { bold: true },
      projects.length > 0
        ? 'DockaShell TUI - Select Project'
        : 'DockaShell TUI - No Projects Found'
    ),
    footer: React.createElement(
      Text,
      { dimColor: true },
      buildFooter(SHORTCUTS.NAVIGATE, SHORTCUTS.OPEN, SHORTCUTS.QUIT)
    ),
    children: React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1, width: '100%' },
      projects.length > 0
        ? React.createElement(Select, {
            options,
            onChange: (value) => {
              setActiveProject(value);
              onSelect?.(value);
            },
          })
        : React.createElement(
            Box,
            { flexDirection: 'column' },
            React.createElement(
              Text,
              null,
              '🚫 No traces found in ~/.dockashell/projects'
            ),
            React.createElement(
              Text,
              null,
              'Use DockaShell to create a project first.'
            )
          )
    ),
  });
};
