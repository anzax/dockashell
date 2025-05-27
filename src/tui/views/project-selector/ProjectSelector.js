import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { LoadingSpinner } from '../../components/LoadingSpinner.js';

const EmptyState = () =>
  React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
    React.createElement(Text, { bold: true }, 'DockaShell TUI - No Projects Found'),
    React.createElement(Text, null, '🚫 No traces found in ~/.dockashell/projects'),
    React.createElement(Text, null, 'Use DockaShell to create a project first.'),
    React.createElement(Text, { dimColor: true }, '[q] Quit')
  );

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState(null);

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
            } catch {}
          }
          list.push({ name, count: lines.length, last });
        } catch {}
      }
      list.sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());
      setProjects(list);
    };
    loadProjects();
  }, []);

  if (projects === null) {
    return React.createElement(
      Box,
      { flexDirection: 'column', paddingX: 1 },
      React.createElement(Text, { bold: true }, 'DockaShell TUI - Loading Projects'),
      React.createElement(LoadingSpinner, { type: 'dots' })
    );
  }

  if (projects.length === 0) {
    return React.createElement(EmptyState);
  }

  const items = projects.map((p) => ({
    label:
      p.name + (p.last ? ` - ${new Date(p.last).toLocaleString()}` : ' - no traces yet'),
    value: p.name,
  }));

  return React.createElement(
    Box,
    { flexDirection: 'column' },
    React.createElement(Text, { bold: true, marginBottom: 1 }, 'DockaShell TUI - Select Project'),
    React.createElement(SelectInput, {
      items,
      onSelect: (item) => onSelect(item.value),
    }),
    React.createElement(Text, { dimColor: true, marginTop: 1 }, '[q] Quit')
  );
};
