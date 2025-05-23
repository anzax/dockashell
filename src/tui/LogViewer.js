import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { readLogEntries } from './read-logs.js';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const formatLines = (text, maxLines) => {
  if (!text) return [];

  const lines = text.split('\n');
  if (lines.length <= maxLines) return lines;

  const half = Math.floor((maxLines - 1) / 2);
  const start = lines.slice(0, half);
  const end = lines.slice(-(maxLines - 1 - half));

  return [
    ...start,
    `... (${lines.length - maxLines + 1} lines truncated) ...`,
    ...end
  ];
};

const getNoteTypeColor = (noteType) => {
  switch (noteType) {
    case 'user': return 'blue';
    case 'agent': return 'green';
    case 'summary': return 'yellow';
    default: return 'white';
  }
};

const getNoteTypeIcon = (noteType) => {
  switch (noteType) {
    case 'user': return '👤';
    case 'agent': return '🧠';
    case 'summary': return '📋';
    default: return '📝';
  }
};

const Entry = ({ entry, selected, maxLines }) => {
  let lines = [];

  // Handle different log entry formats
  if (entry.type === 'note' || entry.kind === 'note') {
    const noteType = entry.noteType || 'note';
    const icon = getNoteTypeIcon(noteType);
    const typeColor = getNoteTypeColor(noteType);
    const timestamp = formatTimestamp(entry.timestamp);
    const typeText = noteType.toUpperCase();

    lines.push({
      type: 'header',
      icon,
      timestamp,
      typeText,
      typeColor
    });

    if (entry.text) {
      const contentLines = formatLines(entry.text, maxLines);
      contentLines.forEach(line => {
        lines.push({
          type: 'content',
          text: line
        });
      });
    }

  } else if (entry.kind === 'command') {
    const timestamp = formatTimestamp(entry.timestamp);
    const icon = '💻';

    lines.push({
      type: 'header',
      icon,
      timestamp,
      typeText: 'COMMAND',
      typeColor: 'cyan'
    });

    // Command line
    lines.push({
      type: 'command',
      text: `$ ${entry.command}`
    });

    // Status line with exit code and duration
    const result = entry.result || {};
    const exitCode = result.exitCode !== undefined ? result.exitCode : 'N/A';
    const duration = result.duration;
    const success = exitCode === 0;

    lines.push({
      type: 'status',
      text: `Exit: ${exitCode}`,
      color: success ? 'green' : 'red',
      extra: ` | Duration: ${duration}`
    });

    // Output
    const output = result.output || '';
    if (output && output.trim()) {
      const outputLines = formatLines(output.trim(), maxLines);
      outputLines.forEach(line => {
        lines.push({
          type: 'output',
          text: line
        });
      });
    }

  } else {
    // Unknown entry format
    const type = entry.type || entry.kind || 'UNKNOWN';
    const timestamp = formatTimestamp(entry.timestamp);

    lines.push({
      type: 'header',
      icon: '❓',
      timestamp,
      typeText: type.toUpperCase(),
      typeColor: 'gray'
    });

    const content = JSON.stringify(entry, null, 2);
    const contentLines = formatLines(content, maxLines);
    contentLines.forEach(line => {
      lines.push({
        type: 'content',
        text: line
      });
    });
  }

  return React.createElement(Box, {
    flexDirection: 'column',
    borderStyle: selected ? 'single' : undefined,
    borderColor: selected ? 'cyan' : undefined,
    paddingLeft: 1,
    paddingRight: 1,
    marginBottom: 1
  },
    ...lines.map((line, idx) => {
      if (line.type === 'header') {
        return React.createElement(Box, { key: idx },
          React.createElement(Text, null, line.icon + ' '),
          React.createElement(Text, { dimColor: true }, line.timestamp + ' '),
          React.createElement(Text, {
            bold: selected,
            color: line.typeColor
          }, `[${line.typeText}]`)
        );
      } else if (line.type === 'command') {
        return React.createElement(Text, {
          key: idx,
          bold: selected,
          color: selected ? 'white' : 'gray'
        }, line.text);
      } else if (line.type === 'status') {
        return React.createElement(Box, { key: idx },
          React.createElement(Text, { color: line.color }, line.text),
          React.createElement(Text, { dimColor: true }, line.extra)
        );
      } else if (line.type === 'output') {
        return React.createElement(Text, {
          key: idx,
          dimColor: !selected,
          color: selected ? 'white' : 'gray'
        }, '  ' + line.text);
      } else {
        return React.createElement(Text, {
          key: idx,
          dimColor: !selected,
          color: selected ? 'white' : 'gray'
        }, line.text);
      }
    })
  );
};

// Calculate the actual height of an entry
const getEntryHeight = (entry, maxLines) => {
  let height = 2; // Header + margin

  if (entry.type === 'note' || entry.kind === 'note') {
    const text = entry.text || '';
    const lines = text.split('\n').length;
    height += Math.min(lines, maxLines);
    if (lines > maxLines) height += 1; // Truncation message
  } else if (entry.kind === 'command') {
    height += 2; // Command line + status line
    const output = entry.result?.output || '';
    if (output.trim()) {
      const lines = output.trim().split('\n').length;
      height += Math.min(lines, maxLines);
      if (lines > maxLines) height += 1; // Truncation message
    }
  } else {
    const content = JSON.stringify(entry, null, 2);
    const lines = content.split('\n').length;
    height += Math.min(lines, maxLines);
    if (lines > maxLines) height += 1; // Truncation message
  }

  return height;
};

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [entries, setEntries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalHeight, setTerminalHeight] = useState(20);
  const { stdout } = useStdout();

  const maxLinesPerEntry = config?.display?.max_lines_per_entry || 10;

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
    process.stdout.on('resize', updateTerminalSize);
    return () => process.stdout.off('resize', updateTerminalSize);
  }, [stdout]);

  // Calculate visible entries based on actual entry heights
  const calculateVisibleEntries = useCallback(() => {
    if (entries.length === 0) return { start: 0, end: 0, count: 0 };

    const availableHeight = terminalHeight - 3; // Header + help text + padding
    let currentHeight = 0;
    let start = scrollOffset;
    let end = scrollOffset;

    // Calculate how many entries can fit
    while (end < entries.length && currentHeight < availableHeight) {
      const entryHeight = getEntryHeight(entries[end], maxLinesPerEntry);
      if (currentHeight + entryHeight <= availableHeight) {
        currentHeight += entryHeight;
        end++;
      } else {
        break;
      }
    }

    return { start, end, count: end - start };
  }, [entries, scrollOffset, terminalHeight, maxLinesPerEntry]);

  // Load entries
  useEffect(() => {
    (async () => {
      try {
        const data = await readLogEntries(project, config?.display?.max_entries || 100);
        setEntries(data);

        // Set initial selection to last entry (most recent)
        if (data.length > 0) {
          const lastIndex = data.length - 1;
          setSelectedIndex(lastIndex);

          // Calculate scroll offset to show the last entry
          let height = 0;
          let offset = lastIndex;
          const availableHeight = terminalHeight - 3;

          while (offset >= 0 && height < availableHeight) {
            const entryHeight = getEntryHeight(data[offset], maxLinesPerEntry);
            if (height + entryHeight <= availableHeight) {
              height += entryHeight;
              offset--;
            } else {
              break;
            }
          }

          setScrollOffset(Math.max(0, offset + 1));
        }
      } catch (err) {
        setEntries([{
          type: 'note',
          noteType: 'error',
          timestamp: new Date().toISOString(),
          text: `Error loading logs: ${err.message}`
        }]);
      }
    })();
  }, [project, config, terminalHeight, maxLinesPerEntry]);

  // Input handling
  useInput((input, key) => {
    const { count: maxVisibleEntries } = calculateVisibleEntries();

    if (key.downArrow && selectedIndex < entries.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);

      // Auto-scroll down if needed
      const { end } = calculateVisibleEntries();
      if (newIndex >= end) {
        setScrollOffset(scrollOffset + 1);
      }
    } else if (key.upArrow && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);

      // Auto-scroll up if needed
      if (newIndex < scrollOffset) {
        setScrollOffset(Math.max(0, newIndex));
      }
    } else if (key.pageDown) {
      const newIndex = Math.min(entries.length - 1, selectedIndex + maxVisibleEntries);
      setSelectedIndex(newIndex);

      // Recalculate scroll offset for page down
      const { start: newStart } = calculateVisibleEntries();
      setScrollOffset(Math.min(entries.length - 1, newStart + maxVisibleEntries));
    } else if (key.pageUp) {
      const newIndex = Math.max(0, selectedIndex - maxVisibleEntries);
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

      // Calculate scroll to show last entry
      let height = 0;
      let offset = newIndex;
      const availableHeight = terminalHeight - 3;

      while (offset >= 0 && height < availableHeight) {
        const entryHeight = getEntryHeight(entries[offset], maxLinesPerEntry);
        if (height + entryHeight <= availableHeight) {
          height += entryHeight;
          offset--;
        } else {
          break;
        }
      }

      setScrollOffset(Math.max(0, offset + 1));
    } else if (input === 'r') {
      // Refresh entries
      (async () => {
        try {
          const data = await readLogEntries(project, config?.display?.max_entries || 100);
          setEntries(data);
          // Maintain selection position if possible
          if (selectedIndex >= data.length) {
            setSelectedIndex(Math.max(0, data.length - 1));
          }
        } catch (err) {
          setEntries([{
            type: 'note',
            noteType: 'error',
            timestamp: new Date().toISOString(),
            text: `Error loading logs: ${err.message}`
          }]);
        }
      })();
    } else if (input === 'b') {
      onBack();
    } else if (input === 'q') {
      onExit();
    }
  });

  if (entries.length === 0) {
    return React.createElement(Box, { flexDirection: 'column', height: terminalHeight },
      React.createElement(Text, { bold: true }, `DockaShell TUI - ${project}`),
      React.createElement(Text, null, 'No log entries found'),
      React.createElement(Text, { dimColor: true }, '[r] Refresh  [b] Back  [q] Quit')
    );
  }

  // Calculate visible entries
  const { start: visibleStart, end: visibleEnd } = calculateVisibleEntries();
  const visibleEntries = entries.slice(visibleStart, visibleEnd);

  // Show scroll indicator
  const hasMore = entries.length > visibleEnd - visibleStart;
  const scrollIndicator = hasMore
    ? ` (${visibleStart + 1}-${visibleEnd} of ${entries.length})`
    : '';

  return React.createElement(Box, {
    flexDirection: 'column',
    height: terminalHeight
  },
    React.createElement(Text, { bold: true }, `DockaShell TUI - ${project}${scrollIndicator}`),
    React.createElement(Box, { flexDirection: 'column', flexGrow: 1 },
      ...visibleEntries.map((entry, i) => {
        const actualIndex = visibleStart + i;
        return React.createElement(Entry, {
          key: `${entry.timestamp}-${actualIndex}`,
          entry: entry,
          selected: actualIndex === selectedIndex,
          maxLines: maxLinesPerEntry
        });
      })
    ),
    React.createElement(Text, { dimColor: true },
      hasMore
        ? '[↑↓] Navigate  [PgUp/PgDn] Page  [g] Top  [G] Bottom  [r] Refresh  [b] Back  [q] Quit'
        : '[↑↓] Navigate  [r] Refresh  [b] Back  [q] Quit'
    )
  );
};
