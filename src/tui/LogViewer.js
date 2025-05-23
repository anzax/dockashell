import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { readLogEntries } from './read-logs.js';

const formatLines = (text, maxLines) => {
  const lines = (text || '').split('\n');
  if (lines.length > maxLines) {
    return [...lines.slice(0, maxLines), `... [${lines.length - maxLines} more lines]`];
  }
  return lines;
};

const Entry = ({ entry, selected, maxLines }) => {
  let header = '';
  let content = '';
  let icon = '';

  if (entry.kind === 'note') {
    const type = (entry.noteType || '').toUpperCase();
    header = `${entry.timestamp} [${type}]`;
    if (entry.noteType === 'agent') icon = '🧠';
    else if (entry.noteType === 'user') icon = '👤';
    content = entry.text || '';
  } else if (entry.kind === 'command') {
    const exit = entry.result?.exitCode;
    const dur = entry.result?.duration;
    header = `${entry.timestamp} [COMMAND]`;
    icon = '💻';
    content = `${entry.command}\nexit_code=${exit} duration=${dur}`;
  } else {
    header = `${entry.timestamp} [${entry.kind}]`;
    content = JSON.stringify(entry, null, 2);
  }

  const lines = formatLines(content, maxLines);

  return React.createElement(Box, { 
    flexDirection: 'column', 
    paddingLeft: 1, 
    borderStyle: selected ? 'round' : undefined, 
    borderColor: 'cyan' 
  },
    React.createElement(Text, null, `${header} ${icon}`),
    ...lines.map((l, idx) => React.createElement(Text, { key: idx }, l))
  );
};

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [entries, setEntries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const maxVisibleEntries = config.display.max_visible_entries || 10;

  useEffect(() => {
    (async () => {
      try {
        const data = await readLogEntries(project, config.display.max_entries);
        setEntries(data);
        // Start with the newest entry selected (at the bottom)
        if (data.length > 0) {
          const newSelectedIndex = data.length - 1;
          setSelectedIndex(newSelectedIndex);
          // Auto-scroll to show the newest entries
          setScrollOffset(Math.max(0, data.length - maxVisibleEntries));
        }
      } catch (err) {
        setEntries([{ kind: 'error', timestamp: '', text: err.message }]);
      }
    })();
  }, [project]);

  useInput((input, key) => {
    if (key.downArrow && selectedIndex < entries.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      
      // Auto-scroll down if selection goes below visible area
      if (newIndex >= scrollOffset + maxVisibleEntries) {
        setScrollOffset(newIndex - maxVisibleEntries + 1);
      }
    } else if (key.upArrow && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      
      // Auto-scroll up if selection goes above visible area
      if (newIndex < scrollOffset) {
        setScrollOffset(newIndex);
      }
    } else if (key.pageDown) {
      const newIndex = Math.min(selectedIndex + maxVisibleEntries, entries.length - 1);
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, newIndex - maxVisibleEntries + 1));
    } else if (key.pageUp) {
      const newIndex = Math.max(selectedIndex - maxVisibleEntries, 0);
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, newIndex));
    } else if (input === 'g') {
      // Go to top
      setSelectedIndex(0);
      setScrollOffset(0);
    } else if (input === 'G') {
      // Go to bottom
      const newIndex = entries.length - 1;
      setSelectedIndex(newIndex);
      setScrollOffset(Math.max(0, entries.length - maxVisibleEntries));
    } else if (input === 'b') {
      onBack();
    } else if (input === 'q') {
      onExit();
    }
  });

  if (entries.length === 0) {
    return React.createElement(Text, null, 'No entries');
  }

  // Calculate visible entries based on scroll offset
  const visibleEntries = entries.slice(scrollOffset, scrollOffset + maxVisibleEntries);
  
  // Calculate scroll indicator
  const hasMore = entries.length > maxVisibleEntries;
  const scrollIndicator = hasMore 
    ? `(${scrollOffset + 1}-${Math.min(scrollOffset + maxVisibleEntries, entries.length)} of ${entries.length})` 
    : '';

  return React.createElement(Box, { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, `DockaShell TUI - ${project} ${scrollIndicator}`),
    ...visibleEntries.map((entry, i) => {
      const actualIndex = scrollOffset + i;
      return React.createElement(Entry, { 
        key: actualIndex, 
        entry: entry, 
        selected: actualIndex === selectedIndex, 
        maxLines: config.display.max_lines_per_entry 
      });
    }),
    React.createElement(Text, { dimColor: true }, 
      hasMore 
        ? '[↑↓] Navigate  [PgUp/PgDn] Page  [g] Top  [G] Bottom  [b] Back  [q] Quit'
        : '[↑↓] Navigate  [b] Back  [q] Quit'
    )
  );
};
