import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select } from '@inkjs/ui';
import { AppContainer } from '../AppContainer.js';
import { SHORTCUTS, buildFooter } from '../../constants/index.js';
import { isBackKey } from '../../ui-utils/text-utils.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState([]);

  useInput((input, key) => {
    if (isBackKey(input, key)) {
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
        ? React.createElement(Select, { options, onChange: onSelect })
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
