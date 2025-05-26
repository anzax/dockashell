import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { TraceBuffer } from './trace-buffer.js';
import { prepareEntry } from './entry-utils.js';
import { TraceDetailsView } from './TraceDetailsView.js';
import { FilterModal } from './FilterModal.js';

const renderLines = (lines, selected) =>
  lines.map((line, idx) => {
    if (line.type === 'header') {
      return React.createElement(
        Box,
        { key: idx },
        React.createElement(Text, { wrap: 'truncate-end' }, line.icon + ' '),
        React.createElement(
          Text,
          { dimColor: true, wrap: 'truncate-end' },
          line.timestamp + ' '
        ),
        React.createElement(
          Text,
          {
            bold: selected,
            color: line.typeColor,
            wrap: 'truncate-end',
          },
          `[${line.typeText}]`
        )
      );
    }
    if (line.type === 'command') {
      return React.createElement(
        Text,
        {
          key: idx,
          bold: selected,
          color: 'gray',
          wrap: 'truncate-end',
        },
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
        React.createElement(
          Text,
          { color: line.color, wrap: 'truncate-end' },
          line.text
        ),
        React.createElement(
          Text,
          { dimColor: true, wrap: 'truncate-end' },
          line.extra
        )
      );
    }
    if (line.type === 'output') {
      return React.createElement(
        Text,
        { key: idx, color: 'gray', wrap: 'truncate-end' },
        '  ' + line.text
      );
    }
    return React.createElement(
      Text,
      { key: idx, color: 'gray', wrap: 'truncate-end' },
      line.text
    );
  });

const Entry = ({ item, selected }) =>
  React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: selected ? 'single' : undefined,
      borderColor: selected ? 'cyan' : undefined,
      paddingLeft: 1,
      paddingRight: 1,
      marginBottom: 1,
    },
    ...renderLines(item.lines, selected)
  );

export const getEntryHeight = (entry, isSelected) => 3 + (isSelected ? 2 : 0); // Always 3 lines (2 content + 1 margin) + 2 for border if selected

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [entries, setEntries] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalHeight, setTerminalHeight] = useState(20);
  const [terminalWidth, setTerminalWidth] = useState(80);
  const [detailsViewIndex, setDetailsViewIndex] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    user: true,
    agent: true,
    summary: true,
    command: true,
    apply_diff: true,
  });
  const [buffer, setBuffer] = useState(null);
  const { stdout } = useStdout();

  const maxLinesPerEntry = config?.display?.max_lines_per_entry || 10;

  // Filter entries based on current filters
  const filteredEntries = entries.filter((entry) => {
    const traceType = entry.traceType || 'unknown';
    return filters[traceType] !== false; // Show if filter is true or undefined
  });
  const ensureVisible = useCallback(
    (index) => {
      if (filteredEntries.length === 0) return;
      let offset = scrollOffset;
      if (index < offset) {
        offset = index;
      } else {
        const availableHeight = terminalHeight - 3;
        let height = 0;
        for (let i = index; i >= offset; i--) {
          height += getEntryHeight(filteredEntries[i], i === index);
          if (height > availableHeight) {
            offset = i + 1;
            break;
          }
        }
      }
      offset = Math.min(Math.max(offset, 0), filteredEntries.length - 1);
      setScrollOffset(offset);
    },
    [filteredEntries, scrollOffset, terminalHeight]
  );

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
    if (filteredEntries.length === 0) return { start: 0, end: 0 };

    const availableHeight = terminalHeight - 3; // header + help
    let height = 0;
    let end = scrollOffset;

    while (
      end < filteredEntries.length &&
      height + getEntryHeight(filteredEntries[end], end === selectedIndex) <=
        availableHeight
    ) {
      height += getEntryHeight(filteredEntries[end], end === selectedIndex);
      end++;
    }

    return { start: scrollOffset, end };
  }, [filteredEntries, scrollOffset, terminalHeight, selectedIndex]);

  // Load entries using TraceBuffer and update when buffer changes
  useEffect(() => {
    const buf = new TraceBuffer(project, config?.display?.max_entries || 100);
    setBuffer(buf);

    const update = () => {
      const raw = buf.getTraces();
      const prepared = raw.map((e) =>
        prepareEntry(e, maxLinesPerEntry, terminalWidth)
      );

      setEntries(prepared);

      if (prepared.length > 0) {
        const lastIndex = prepared.length - 1;
        setSelectedIndex(lastIndex);

        // Calculate scroll offset to show maximum entries while keeping selected visible
        const availableHeight = terminalHeight - 3;
        let totalHeight = 0;
        let visibleCount = 0;

        // Count how many entries we can fit starting from the selected entry
        for (let i = lastIndex; i >= 0; i--) {
          const entryHeight = getEntryHeight(prepared[i], i === lastIndex);
          if (totalHeight + entryHeight <= availableHeight) {
            totalHeight += entryHeight;
            visibleCount++;
          } else {
            break;
          }
        }

        // Set scroll offset to show the maximum number of entries
        const newOffset = Math.max(0, lastIndex - visibleCount + 1);
        setScrollOffset(newOffset);
      }
    };

    buf.onUpdate(update);
    buf.start().catch(() => {});
    update();

    return () => {
      buf.close();
    };
  }, [project, config, terminalHeight, terminalWidth, maxLinesPerEntry]);

  // Input handling
  useInput((input, key) => {
    // Skip input handling when details view is open (it handles its own input)
    if (detailsViewIndex !== null || showFilterModal) return;

    const { start, end } = calculateVisibleEntries();
    const pageSize = end - start || 1;

    if (key.return) {
      setDetailsViewIndex(selectedIndex);
    } else if (key.downArrow && selectedIndex < filteredEntries.length - 1) {
      const idx = selectedIndex + 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (key.upArrow && selectedIndex > 0) {
      const idx = selectedIndex - 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        selectedIndex + pageSize
      );
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
      const idx = filteredEntries.length - 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
    } else if (input === 'f') {
      setShowFilterModal(true);
    } else if (input === 'r') {
      buffer?.refresh().catch(() => {});
    } else if (input === 'b') {
      onBack();
    } else if (input === 'q') {
      onExit();
    }
  });

  const { start: visibleStart, end: visibleEnd } = calculateVisibleEntries();
  const visibleEntries = filteredEntries.slice(visibleStart, visibleEnd);
  const hasMore = filteredEntries.length > visibleEnd - visibleStart;
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const totalFilters = Object.keys(filters).length;
  const filterIndicator =
    activeFilters < totalFilters
      ? ` [${activeFilters}/${totalFilters} filtered]`
      : '';
  const scrollIndicator = hasMore
    ? ` (${visibleStart + 1}-${visibleEnd} of ${filteredEntries.length}${filterIndicator})`
    : filterIndicator;

  // Show filter modal if requested
  if (showFilterModal) {
    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        height: terminalHeight,
        justifyContent: 'center',
        alignItems: 'center',
      },
      React.createElement(FilterModal, {
        currentFilters: filters,
        onClose: () => setShowFilterModal(false),
        onApply: (newFilters) => {
          setFilters(newFilters);
          setShowFilterModal(false);
          setSelectedIndex(0); // Reset selection after filtering
          setScrollOffset(0);
        },
      })
    );
  }
  // Show details view if index is set
  if (detailsViewIndex !== null) {
    return React.createElement(TraceDetailsView, {
      traces: filteredEntries,
      currentIndex: detailsViewIndex,
      onClose: () => setDetailsViewIndex(null),
      onNavigate: (newIndex) => {
        setDetailsViewIndex(newIndex);
        setSelectedIndex(newIndex); // Keep main list in sync
      },
      height: terminalHeight,
    });
  }

  return React.createElement(
    Box,
    { flexDirection: 'column', height: terminalHeight },
    React.createElement(
      Text,
      { bold: true, wrap: 'truncate-end' },
      `DockaShell TUI - ${project}${scrollIndicator}`
    ),
    React.createElement(
      Box,
      { flexDirection: 'column', flexGrow: 1 },
      ...visibleEntries.map((entry, i) => {
        const actualIndex = visibleStart + i;
        return React.createElement(Entry, {
          key: `${entry.entry.timestamp}-${actualIndex}`,
          item: entry,
          selected: actualIndex === selectedIndex,
        });
      })
    ),
    React.createElement(
      Text,
      { dimColor: true, wrap: 'truncate-end' },
      hasMore
        ? '[↑↓] Navigate  [Enter] Detail  [PgUp/PgDn] Page  [g] Top  [G] Bottom  [f] Filter  [r] Refresh  [b] Back  [q] Quit'
        : '[↑↓] Navigate  [Enter] Detail  [f] Filter  [r] Refresh  [b] Back  [q] Quit'
    )
  );
};
