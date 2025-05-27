import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStdoutDimensions } from '../../hooks/useStdoutDimensions.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Custom hook for managing list selection and scrolling
const useScrollableList = (items, terminalHeight) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const maxVisible = Math.max(3, terminalHeight - 5);

  const navigate = (direction) => {
    if (direction === 'down' && selectedIndex < items.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      if (newIndex >= scrollOffset + maxVisible) {
        setScrollOffset(newIndex - maxVisible + 1);
      }
    } else if (direction === 'up' && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      if (newIndex < scrollOffset) {
        setScrollOffset(newIndex);
      }
    }
  };

  // Reset when items change
  useEffect(() => {
    setSelectedIndex(0);
    setScrollOffset(0);
  }, [items.length]);

  const visibleItems = items.slice(scrollOffset, scrollOffset + maxVisible);
  const hasMore = items.length > maxVisible;
  const scrollIndicator = hasMore
    ? ` (${scrollOffset + 1}-${Math.min(scrollOffset + maxVisible, items.length)} of ${items.length})`
    : '';

  return {
    selectedIndex,
    visibleItems,
    scrollIndicator,
    navigate,
    getActualIndex: (visibleIndex) => scrollOffset + visibleIndex,
  };
};

// Simple project item component
const ProjectItem = ({ project, selected }) =>
  React.createElement(
    Box,
    {
      flexDirection: 'row',
      paddingLeft: 1,
      paddingRight: 1,
      borderStyle: selected ? 'single' : undefined,
      borderColor: selected ? 'cyan' : undefined,
    },
    React.createElement(
      Text,
      { color: selected ? 'cyan' : undefined, bold: selected },
      project.name +
        (project.last
          ? ` - ${new Date(project.last).toLocaleString()}`
          : ' - no traces yet')
    )
  );

// Empty state component
const EmptyState = () =>
  React.createElement(
    Box,
    { flexDirection: 'column', paddingX: 1 },
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
    React.createElement(Text, { dimColor: true }, '[q] Quit')
  );

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState([]);
  const [, terminalHeight] = useStdoutDimensions();

  const {
    selectedIndex,
    visibleItems,
    scrollIndicator,
    navigate,
    getActualIndex,
  } = useScrollableList(projects, terminalHeight);

  // Load projects
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
              // Skip malformed entries
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

  // Input handling
  useInput((input, key) => {
    if (key.downArrow) {
      navigate('down');
    } else if (key.upArrow) {
      navigate('up');
    } else if (key.return) {
      const selected = projects[selectedIndex];
      if (selected) onSelect(selected.name);
    } else if (input === 'q') {
      onExit();
    }
  });

  if (projects.length === 0) {
    return React.createElement(EmptyState);
  }

  return React.createElement(
    Box,
    { flexDirection: 'column', height: terminalHeight },
    React.createElement(
      Text,
      { bold: true, marginBottom: 1 },
      `DockaShell TUI - Select Project${scrollIndicator}`
    ),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1 },
      ...visibleItems.map((project, i) =>
        React.createElement(ProjectItem, {
          key: project.name,
          project,
          selected: getActualIndex(i) === selectedIndex,
        })
      )
    ),
    React.createElement(
      Text,
      { dimColor: true, marginTop: 1 },
      '[↑↓] Navigate  [Enter] Select  [q] Quit'
    )
  );
};
