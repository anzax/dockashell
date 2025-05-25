import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const ProjectItem = ({ project, selected }) => {
  const timeStr = project.last
    ? `, last: ${new Date(project.last).toLocaleDateString()}`
    : '';
  const displayText = `${project.name} (${project.count} entries${timeStr})`;

  return React.createElement(
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
      {
        color: selected ? 'cyan' : undefined,
        bold: selected,
      },
      displayText
    )
  );
};

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalHeight, setTerminalHeight] = useState(20);
  const { stdout } = useStdout();

  // Calculate max visible projects based on terminal height
  // Reserve space for header (2 lines) + help text (1 line) + padding (2 lines)
  const maxVisibleProjects = Math.max(3, terminalHeight - 5);

  // Handle terminal resize
  useEffect(() => {
    const updateTerminalSize = () => {
      if (stdout && stdout.rows) {
        setTerminalHeight(stdout.rows);
      } else if (process.stdout && process.stdout.rows) {
        setTerminalHeight(process.stdout.rows);
      }
    };

    updateTerminalSize();

    const onResize = () => {
      updateTerminalSize();
    };

    if (process.stdout) {
      process.stdout.on('resize', onResize);
      return () => {
        process.stdout.removeListener('resize', onResize);
      };
    }
  }, [stdout]);

  // Adjust scroll when maxVisibleProjects changes (terminal resize)
  useEffect(() => {
    if (projects.length > 0) {
      // Ensure selected item stays visible after resize
      if (selectedIndex < scrollOffset) {
        setScrollOffset(selectedIndex);
      } else if (selectedIndex >= scrollOffset + maxVisibleProjects) {
        setScrollOffset(Math.max(0, selectedIndex - maxVisibleProjects + 1));
      }
    }
  }, [maxVisibleProjects, selectedIndex, scrollOffset, projects.length]);

  useEffect(() => {
    (async () => {
      const projectsDir = path.join(os.homedir(), '.dockashell', 'projects');
      await fs.ensureDir(projectsDir);
      const projects = await fs.readdir(projectsDir);
      const list = [];
      for (const name of projects) {
        const file = path.join(projectsDir, name, 'traces', 'current.jsonl');
        if (!(await fs.pathExists(file))) continue;
        try {
          const lines = (await fs.readFile(file, 'utf8'))
            .split('\n')
            .filter(Boolean);
          const count = lines.length;
          let last = '';
          if (count > 0) {
            try {
              const obj = JSON.parse(lines[count - 1]);
              last = obj.timestamp;
            } catch {
              // Skip malformed entries
            }
          }
          list.push({ name, count, last });
        } catch {
          // Skip unreadable files
        }
      }
      list.sort(
        (a, b) => new Date(b.last).getTime() - new Date(a.last).getTime()
      );
      setProjects(list);
      setSelectedIndex(0); // Reset selection when projects load
      setScrollOffset(0); // Reset scroll when projects load
    })();
  }, []);

  useInput((input, key) => {
    if (key.downArrow && selectedIndex < projects.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);

      // Auto-scroll down if selection goes below visible area
      if (newIndex >= scrollOffset + maxVisibleProjects) {
        setScrollOffset(newIndex - maxVisibleProjects + 1);
      }
    } else if (key.upArrow && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);

      // Auto-scroll up if selection goes above visible area
      if (newIndex < scrollOffset) {
        setScrollOffset(newIndex);
      }
    } else if (key.return) {
      const selected = projects[selectedIndex];
      if (selected) onSelect(selected.name);
    } else if (input === 'q') {
      onExit();
    }
  });

  if (projects.length === 0) {
    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        height: terminalHeight,
        paddingX: 1,
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
      React.createElement(Text, { dimColor: true }, '[q] Quit')
    );
  }

  // Calculate visible projects based on scroll offset
  const visibleProjects = projects.slice(
    scrollOffset,
    scrollOffset + maxVisibleProjects
  );

  // Calculate scroll indicator
  const hasMore = projects.length > maxVisibleProjects;
  const scrollIndicator = hasMore
    ? ` (${scrollOffset + 1}-${Math.min(scrollOffset + maxVisibleProjects, projects.length)} of ${projects.length})`
    : '';

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      height: terminalHeight,
    },
    React.createElement(
      Text,
      { bold: true, marginBottom: 1 },
      `DockaShell TUI - Select Project${scrollIndicator}`
    ),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1 },
      ...visibleProjects.map((project, i) => {
        const actualIndex = scrollOffset + i;
        return React.createElement(ProjectItem, {
          key: project.name,
          project,
          selected: actualIndex === selectedIndex,
        });
      })
    ),
    React.createElement(
      Text,
      { dimColor: true, marginTop: 1 },
      '[↑↓] Navigate  [Enter] Select  [q] Quit'
    )
  );
};
