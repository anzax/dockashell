import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import chokidar from 'chokidar';
import { readTraceEntries, listSessions, getTraceFile } from './read-traces.js';
import { prepareEntry } from './entry-utils.js';

const renderLines = (lines, selected, isModal = false) =>
  lines.map((line, idx) => {
    if (line.type === 'header') {
      return React.createElement(
        Box,
        { key: idx },
        React.createElement(Text, { wrap: 'truncate-end' }, line.icon + ' '),
        React.createElement(Text, { dimColor: !isModal, wrap: 'truncate-end' }, line.timestamp + ' '),
        React.createElement(
          Text,
          { bold: selected && !isModal, color: line.typeColor, wrap: 'truncate-end' },
          `[${line.typeText}]`
        )
      );
    }
    if (line.type === 'command') {
      return React.createElement(
        Text,
        { key: idx, bold: selected && !isModal, color: isModal ? 'white' : 'cyan', wrap: 'truncate-end' },
        line.text
      );
    }
    if (line.type === 'separator') {
      return React.createElement(
        Text,
        { key: idx, dimColor: true, wrap: 'truncate-end' },
        line.text
      );
    }
    if (line.type === 'status') {
      return React.createElement(
        Box,
        { key: idx },
        React.createElement(Text, { color: line.color, wrap: 'truncate-end' }, line.text),
        React.createElement(Text, { dimColor: !isModal, wrap: 'truncate-end' }, line.extra)
      );
    }
    if (line.type === 'output') {
      return React.createElement(
        Text,
        { key: idx, color: isModal ? 'white' : 'gray', wrap: 'truncate-end' },
        '  ' + line.text
      );
    }
    return React.createElement(
      Text,
      { key: idx, color: isModal ? 'white' : 'gray', wrap: 'truncate-end' },
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
    ...renderLines(item.lines, selected, false)
  );
};

export const getEntryHeight = (entry, isSelected) =>
  3 + (isSelected ? 2 : 0); // Always 3 lines (2 content + 1 margin) + 2 for border if selected

const EntryModal = ({ item, onClose, height }) => {
  const [offset, setOffset] = useState(0);

  const availableHeight = Math.max(1, height - 6); // header, help, borders
  const maxOffset = Math.max(0, item.fullLines.length - availableHeight);
  const visible = item.fullLines.slice(offset, offset + availableHeight);

  useInput((input, key) => {
    if (key.escape || key.return || input === 'q') {
      onClose();
      return;
    }
    if (key.downArrow) setOffset((o) => Math.min(maxOffset, o + 1));
    else if (key.upArrow) setOffset((o) => Math.max(0, o - 1));
    else if (key.pageDown) setOffset((o) => Math.min(maxOffset, o + availableHeight));
    else if (key.pageUp) setOffset((o) => Math.max(0, o - availableHeight));
    else if (input === 'g') setOffset(0);
    else if (input === 'G') setOffset(maxOffset);
  });

  const indicator = item.fullLines.length > availableHeight
    ? ` (${offset + 1}-${Math.min(item.fullLines.length, offset + availableHeight)} of ${item.fullLines.length})`
    : '';

  return React.createElement(
    Box,
    { flexDirection: 'column', height },
    React.createElement(Text, { bold: true, wrap: 'truncate-end' }, `Log Entry Detail${indicator}`),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1, borderStyle: 'double', paddingLeft: 1, paddingRight: 1, marginY: 1 },
      ...renderLines(visible, false, true)
    ),
    React.createElement(Text, { dimColor: true, wrap: 'truncate-end' }, '[↑↓ PgUp/PgDn g/G] Scroll  [Enter/Esc/q] Close')
  );
};

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [entries, setEntries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalHeight, setTerminalHeight] = useState(20);
  const [terminalWidth, setTerminalWidth] = useState(80);
  const [modalEntry, setModalEntry] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [watcher, setWatcher] = useState(null);
  const { stdout } = useStdout();

  const maxLinesPerEntry = config?.display?.max_lines_per_entry || 10;

  useEffect(() => {
    return () => {
      if (watcher) watcher.close().catch(() => {});
    };
  }, [watcher]);

  // Load sessions on mount
  useEffect(() => {
    (async () => {
      try {
        const ses = await listSessions(project);
        setSessions(ses);
        setSessionIndex(Math.max(0, ses.length - 1));
      } catch {
        setSessions(['current']);
        setSessionIndex(0);
      }
    })();
  }, [project]);

  const ensureVisible = useCallback((index) => {
    if (entries.length === 0) return;
    let offset = scrollOffset;
    if (index < offset) {
      offset = index;
    } else {
      const availableHeight = terminalHeight - 3;
      let height = 0;
      for (let i = index; i >= offset; i--) {
        height += getEntryHeight(entries[i], i === index);
        if (height > availableHeight) {
          offset = i + 1;
          break;
        }
      }
    }
    offset = Math.min(Math.max(offset, 0), entries.length - 1);
    setScrollOffset(offset);
  }, [entries, scrollOffset, terminalHeight]);

  // Handle terminal resize
  useEffect(() => {
    const updateTerminalSize = () => {
      if (stdout?.rows) {
        setTerminalHeight(stdout.rows);
      } else if (process.stdout?.rows) {
        setTerminalHeight(process.stdout.rows);
      }
      
      if (stdout?.columns) {
        setTerminalWidth(stdout.columns);
      } else if (process.stdout?.columns) {
        setTerminalWidth(process.stdout.columns);
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

    while (
      end < entries.length &&
      height + getEntryHeight(entries[end], end === selectedIndex) <= availableHeight
    ) {
      height += getEntryHeight(entries[end], end === selectedIndex);
      end++;
    }

    return { start: scrollOffset, end };
  }, [entries, scrollOffset, terminalHeight, selectedIndex]);

  // Load entries for the active session and watch for updates
  useEffect(() => {
    if (sessions.length === 0) return;
    const sessionId = sessions[sessionIndex];

    let active = true;
    let w;

    const load = async () => {
      try {
        const raw = await readTraceEntries(project, config?.display?.max_entries || 100, sessionId);
        const prepared = raw.map((e) => prepareEntry(e, maxLinesPerEntry, terminalWidth));
        if (!active) return;

        setEntries(prepared);

        if (prepared.length > 0) {
          const lastIndex = prepared.length - 1;
          setSelectedIndex(lastIndex);

          let height = 0;
          let offset = lastIndex;
          const availableHeight = terminalHeight - 3;

          while (
            offset >= 0 &&
            height + getEntryHeight(prepared[offset], offset === lastIndex) <= availableHeight
          ) {
            height += getEntryHeight(prepared[offset], offset === lastIndex);
            offset--;
          }

          offset = Math.max(0, Math.min(prepared.length - 1, offset + 1));
          setScrollOffset(offset);
        }
      } catch (err) {
        if (!active) return;
        setEntries([
          prepareEntry(
            {
              type: 'note',
              noteType: 'error',
              timestamp: new Date().toISOString(),
              text: `Error loading traces: ${err.message}`
            },
            maxLinesPerEntry,
            terminalWidth
          )
        ]);
      }
    };

    load();

    if (watcher) {
      watcher.close().catch(() => {});
      setWatcher(null);
    }

    if (sessionId === 'current') {
      const file = getTraceFile(project, 'current');
      w = chokidar.watch(file, { ignoreInitial: true });
      w.on('add', load);
      w.on('change', load);
      setWatcher(w);
    }

    return () => {
      active = false;
      if (w) w.close();
    };
  }, [project, sessions, sessionIndex, config, terminalHeight, terminalWidth, maxLinesPerEntry]);

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
          const sessionId = sessions[sessionIndex];
          const raw = await readTraceEntries(project, config?.display?.max_entries || 100, sessionId);
          const prepared = raw.map((e) => prepareEntry(e, maxLinesPerEntry, terminalWidth));

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
                text: `Error loading traces: ${err.message}`
              },
              maxLinesPerEntry,
              terminalWidth
            )
          ]);
        }
      })();
    } else if (input === ']' && sessionIndex < sessions.length - 1) {
      setSessionIndex((i) => Math.min(sessions.length - 1, i + 1));
      setSelectedIndex(0);
      setScrollOffset(0);
    } else if (input === '[' && sessionIndex > 0) {
      setSessionIndex((i) => Math.max(0, i - 1));
      setSelectedIndex(0);
      setScrollOffset(0);
    } else if (input === 'b') {
      onBack();
    } else if (input === 'q') {
      onExit();
    }
  });

  const { start: visibleStart, end: visibleEnd } = calculateVisibleEntries();
  const visibleEntries = entries.slice(visibleStart, visibleEnd);
  const hasMore = entries.length > visibleEnd - visibleStart;
  const scrollIndicator = hasMore
    ? ` (${visibleStart + 1}-${visibleEnd} of ${entries.length})`
    : '';
  const sessionIndicator = sessions.length > 1 ? ` [${sessionIndex + 1}/${sessions.length}]` : '';

  if (modalEntry) {
    return React.createElement(EntryModal, { item: modalEntry, onClose: () => setModalEntry(null), height: terminalHeight });
  }

  return React.createElement(
    Box,
    { flexDirection: 'column', height: terminalHeight },
    React.createElement(Text, { bold: true, wrap: 'truncate-end' }, `DockaShell TUI - ${project}${sessionIndicator}${scrollIndicator}`),
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
      { dimColor: true, wrap: 'truncate-end' },
      hasMore
        ? '[↑↓] Navigate  [Enter] Detail  [PgUp/PgDn] Page  [g] Top  [G] Bottom  [[/]] Session  [r] Refresh  [b] Back  [q] Quit'
        : '[↑↓] Navigate  [Enter] Detail  [[/]] Session  [r] Refresh  [b] Back  [q] Quit'
    )
  );
};
