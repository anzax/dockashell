import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import { AppContainer } from '../components/app-container.js';
import { discoverProjects } from '../ui-utils/project-discovery.js';
import { setActiveProject } from '../stores/project-store.js';
import { dispatch as uiDispatch } from '../stores/ui-store.js';

export const ProjectSelector = () => {
  const [projects, setProjects] = useState([]);

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
    children: React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1, width: '100%' },
      projects.length > 0
        ? React.createElement(Select, {
            options,
            onChange: (value) => {
              setActiveProject(value);
              uiDispatch({ type: 'set-view', view: 'log' });
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
