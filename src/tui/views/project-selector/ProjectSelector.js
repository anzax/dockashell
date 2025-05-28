import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { useStdoutDimensions } from '../../hooks/useStdoutDimensions.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const EmptyState = ({ height }) =>
  React.createElement(
    Box,
    {
      flexDirection: 'column',
      height,
      justifyContent: 'center',
      alignItems: 'center',
      paddingX: 2,
    },
    React.createElement(
      Text,
      { bold: true },
      'DockaShell TUI - No Projects Found'
    ),
    React.createElement(
      Text,
      null,
      '🚫 No traces found in ~/.dockashell/projects'
    ),
    React.createElement(
      Text,
      null,
      'Use DockaShell to create a project first.'
    ),
    React.createElement(Text, null, ''),
    React.createElement(Text, { dimColor: true }, '[q] Quit')
  );

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState([]);
  const [, terminalHeight] = useStdoutDimensions();

  useInput((input) => {
    if (input === 'q') {
      onExit();
    }
  });

  useEffect(() => {
    const loadProjects = async () => {
      const projectsDir = path.join(os.homedir(), '.dockashell', 'projects');
      await fs.ensureDir(projectsDir);
      const projectNames = await fs.readdir(projectsDir);
      const list = [];

      for (const name of projectNames) {
        const file = path.join(projectsDir, name, 'traces', 'current.jsonl');
        if (!(await fs.pathExists(file))) continue;
        try {
          const content = await fs.readFile(file, 'utf8');
          const lines = content.split('\n').filter(Boolean);
          let last = '';
          if (lines.length > 0) {
            try {
              const obj = JSON.parse(lines[lines.length - 1]);
              last = obj.timestamp;
            } catch {
              // Skip malformed JSON entries
            }
          }
          list.push({ name, count: lines.length, last });
        } catch {
          // Skip unreadable files
        }
      }
      list.sort(
        (a, b) => new Date(b.last).getTime() - new Date(a.last).getTime()
      );
      setProjects(list);
    };
    loadProjects();
  }, []);

  if (projects.length === 0) {
    return React.createElement(EmptyState, { height: terminalHeight });
  }

  const items = projects.map((p) => ({
    label:
      p.name +
      (p.last ? ` - ${new Date(p.last).toLocaleString()}` : ' - no traces yet'),
    value: p.name,
  }));

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      height: terminalHeight,
      paddingX: 2,
      paddingY: 1,
    },
    React.createElement(
      Text,
      { bold: true, marginBottom: 2 },
      'DockaShell TUI - Select Project'
    ),
    React.createElement(
      Box,
      { flexGrow: 1, flexDirection: 'column' },
      React.createElement(SelectInput, {
        items,
        onSelect: (item) => onSelect(item.value),
      })
    ),
    React.createElement(
      Text,
      { dimColor: true, marginTop: 2 },
      '[↑↓] Navigate  [Enter] Select  [1-9] Quick Select  [q] Quit'
    )
  );
};
