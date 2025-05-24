import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { readLogEntries } from './read-logs.js';
import { prepareEntry } from './entry-utils.js';

const renderLines = (lines, selected) =>
  lines.map((line, idx) => {
    if (line.type === 'header') {
      return React.createElement(
        Box,
        { key: idx },
        React.createElement(Text, null, line.icon + ' '),
        React.createElement(Text, { dimColor: true }, line.timestamp + ' '),
        React.createElement(
          Text,
          { bold: selected, color: line.typeColor },
          `[${line.typeText}]`
        )
      );
    }
    if (line.type === 'command') {
      return React.createElement(
        Text,
        { key: idx, bold: selected, color: selected ? 'white' : 'gray' },
        line.text
      );
    }
    if (line.type === 'status') {
      return React.createElement(
        Box,
        { key: idx },
        React.createElement(Text, { color: line.color }, line.text),
        React.createElement(Text, { dimColor: true }, line.extra)
      );
    }
    if (line.type === 'output') {
      return React.createElement(
        Text,
        { key: idx, dimColor: !selected, color: selected ? 'white' : 'gray' },
        '  ' + line.text
      );
    }
    return React.createElement(
      Text,
      { key: idx, dimColor: !selected, color: selected ? 'white' : 'gray' },
      line.text
    );
  });

const Entry = ({ item, selected }) => {
  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: selected ? 'single' : undefined,
      borderColor: selected ? 'cyan' : undefined,
      paddingLeft: 1,
      paddingRight: 1,
      marginBottom: 1
    },
    ...renderLines(item.lines, selected)
  );
};

const EntryModal = ({ item, onClose, height }) => {
  useInput((input, key) => {
    if (key.escape || key.return || input === 'q') onClose();
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', height },
    React.createElement(Text, { bold: true }, 'Log Entry Detail'),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1, borderStyle: 'double', paddingLeft: 1, paddingRight: 1, marginY: 1 },
      ...renderLines(item.fullLines, false)
    ),
    React.createElement(Text, { dimColor: true }, '[Enter/Esc] Close')
  );
};

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [entries, setEntries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalHeight, setTerminalHeight] = useState(20);
  const [modalEntry, setModalEntry] = useState(null);
  const { stdout } = useStdout();

  const maxLinesPerEntry = config?.display?.max_lines_per_entry || 10;

  const ensureVisible = useCallback((index) => {
    if (entries.length === 0) return;
    let offset = scrollOffset;
    if (index < offset) {
      offset = index;
    } else {
      const availableHeight = terminalHeight - 3;
      let height = 0;
      for (let i = index; i >= offset; i--) {
        height += entries[i].height;
        if (height > availableHeight) {
          offset = i + 1;
          break;
        }
      }
    }
    setScrollOffset(offset);
  }, [entries, scrollOffset, terminalHeight]);

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

  const calculateVisibleEntries = useCallback(() => {
    if (entries.length === 0) return { start: 0, end: 0 };

    const availableHeight = terminalHeight - 3; // header + help
    let height = 0;
    let end = scrollOffset;

    while (end < entries.length && height + entries[end].height <= availableHeight) {
      height += entries[end].height;
      end++;
    }

    return { start: scrollOffset, end };
  }, [entries, scrollOffset, terminalHeight]);

  // Load entries
  useEffect(() => {
    (async () => {
      try {
        const raw = await readLogEntries(project, config?.display?.max_entries || 100);
        const prepared = raw.map((e) => prepareEntry(e, maxLinesPerEntry));
        setEntries(prepared);

        if (prepared.length > 0) {
          const lastIndex = prepared.length - 1;
          setSelectedIndex(lastIndex);

          let height = 0;
          let offset = lastIndex;
          const availableHeight = terminalHeight - 3;

          while (offset >= 0 && height + prepared[offset].height <= availableHeight) {
            height += prepared[offset].height;
            offset--;
          }

          setScrollOffset(Math.max(0, offset + 1));
        }
      } catch (err) {
        setEntries([
          prepareEntry(
            {
              type: 'note',
              noteType: 'error',
              timestamp: new Date().toISOString(),
              text: `Error loading logs: ${err.message}`
            },
            maxLinesPerEntry
          )
        ]);
      }
    })();
  }, [project, config, terminalHeight, maxLinesPerEntry]);

  // Input handling
  useInput((input, key) => {
    const { start, end } = calculateVisibleEntries();
    const pageSize = end - start || 1;

    if (modalEntry) {
      if (key.escape || key.return || input === 'q') setModalEntry(null);
      return;
    }

    if (key.return) {
      setModalEntry(entries[selectedIndex]);
    } else if (key.downArrow && selectedIndex < entries.length - 1) {
      const idx = selectedIndex + 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (key.upArrow && selectedIndex > 0) {
      const idx = selectedIndex - 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (key.pageDown) {
      const idx = Math.min(entries.length - 1, selectedIndex + pageSize);
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, selectedIndex - pageSize);
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (input === 'g') {
      setSelectedIndex(0);
      ensureVisible(0);
    } else if (input === 'G') {
      const idx = entries.length - 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (input === 'r') {
      (async () => {
        try {
          const raw = await readLogEntries(project, config?.display?.max_entries || 100);
          const prepared = raw.map((e) => prepareEntry(e, maxLinesPerEntry));
          setEntries(prepared);
          if (selectedIndex >= prepared.length) {
            setSelectedIndex(Math.max(0, prepared.length - 1));
          }
        } catch (err) {
          setEntries([
            prepareEntry(
              {
                type: 'note',
                noteType: 'error',
                timestamp: new Date().toISOString(),
                text: `Error loading logs: ${err.message}`
              },
              maxLinesPerEntry
            )
          ]);
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

  if (modalEntry) {
    return React.createElement(EntryModal, { item: modalEntry, onClose: () => setModalEntry(null), height: terminalHeight });
  }

  return React.createElement(
    Box,
    { flexDirection: 'column', height: terminalHeight },
    React.createElement(Text, { bold: true }, `DockaShell TUI - ${project}${scrollIndicator}`),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1 },
      ...visibleEntries.map((entry, i) => {
        const actualIndex = visibleStart + i;
        return React.createElement(Entry, {
          key: `${entry.entry.timestamp}-${actualIndex}`,
          item: entry,
          selected: actualIndex === selectedIndex
        });
      })
    ),
    React.createElement(
      Text,
      { dimColor: true },
      hasMore
        ? '[↑↓] Navigate  [PgUp/PgDn] Page  [g] Top  [G] Bottom  [r] Refresh  [b] Back  [q] Quit'
        : '[↑↓] Navigate  [r] Refresh  [b] Back  [q] Quit'
    )
  );
};
