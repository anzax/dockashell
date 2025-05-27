import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { TraceBuffer } from './trace-buffer.js';
import { prepareEntry } from './entry-utils.js';
import { TraceDetailsView } from './TraceDetailsView.js';
import { FilterModal } from './FilterModal.js';
import { LineRenderer } from './LineRenderer.js';

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
    ...item.lines.map((line, idx) =>
      React.createElement(LineRenderer, { key: idx, line, selected })
    )
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [filters, setFilters] = useState({
    user: true,
    agent: true,
    summary: true,
    command: true,
    apply_patch: true,
  });
  const autoScrollRef = useRef(true);
  const detailsViewRef = useRef(null);
  const selectedIndexRef = useRef(0);
  const selectedTimestampRef = useRef(null);
  const detailsTimestampRef = useRef(null);
  const filtersRef = useRef(filters);
  const [buffer, setBuffer] = useState(null);
  const { stdout } = useStdout();

  // Keep refs synced with state for callbacks
  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  useEffect(() => {
    detailsViewRef.current = detailsViewIndex;
  }, [detailsViewIndex]);

  // Filter entries based on current filters
  const filteredEntries = entries.filter((entry) => {
    const traceType = entry.traceType || 'unknown';
    return filters[traceType] !== false; // Show if filter is true or undefined
  });

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    selectedTimestampRef.current =
      filteredEntries[selectedIndex]?.entry.timestamp || null;
  }, [selectedIndex, filteredEntries]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (detailsViewIndex !== null) {
      detailsTimestampRef.current =
        filteredEntries[detailsViewIndex]?.entry.timestamp || null;
    }
  }, [detailsViewIndex, filteredEntries]);
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

  const updateAutoScrollState = (idx) => {
    const threshold = 5;
    if (filteredEntries.length - idx > threshold) {
      setAutoScroll(false);
    } else if (idx >= filteredEntries.length - 1) {
      setAutoScroll(true);
    }
  };

  // Handle terminal resize
  useEffect(() => {
    const updateTerminalSize = () => {
      // Provide fallbacks for undefined terminal dimensions
      if (stdout?.rows) {
        setTerminalHeight(stdout.rows);
      } else if (process.stdout?.rows) {
        setTerminalHeight(process.stdout.rows);
      } else {
        setTerminalHeight(24); // Fallback height
      }

      if (stdout?.columns) {
        setTerminalWidth(stdout.columns);
      } else if (process.stdout?.columns) {
        setTerminalWidth(process.stdout.columns);
      } else {
        setTerminalWidth(80); // Fallback width
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
      const prepared = raw.map((e) => prepareEntry(e, null, terminalWidth));

      const filtered = prepared.filter((entry) => {
        const traceType = entry.traceType || 'unknown';
        return filtersRef.current[traceType] !== false;
      });

      const lastIndex = filtered.length - 1;

      let newSelected = filtered.findIndex(
        (e) => e.entry.timestamp === selectedTimestampRef.current
      );
      if (newSelected === -1) {
        newSelected = Math.min(
          selectedIndexRef.current,
          Math.max(lastIndex, 0)
        );
      }

      let newDetailsIndex = null;
      if (detailsViewRef.current !== null) {
        newDetailsIndex = filtered.findIndex(
          (e) => e.entry.timestamp === detailsTimestampRef.current
        );
        if (newDetailsIndex === -1) {
          newDetailsIndex = Math.min(detailsViewRef.current, lastIndex);
        }
      }

      setEntries(prepared);

      if (autoScrollRef.current && detailsViewRef.current === null) {
        newSelected = lastIndex;

        const availableHeight = terminalHeight - 3;
        let totalHeight = 0;
        let visibleCount = 0;

        for (let i = lastIndex; i >= 0; i--) {
          const entryHeight = getEntryHeight(filtered[i], i === lastIndex);
          if (totalHeight + entryHeight <= availableHeight) {
            totalHeight += entryHeight;
            visibleCount++;
          } else {
            break;
          }
        }

        const newOffset = Math.max(0, lastIndex - visibleCount + 1);
        setScrollOffset(newOffset);
      } else {
        setScrollOffset((off) => Math.min(off, Math.max(lastIndex, 0)));
      }

      setSelectedIndex(Math.max(0, newSelected));
      if (detailsViewRef.current !== null) {
        setDetailsViewIndex(Math.max(0, newDetailsIndex));
      }
    };

    buf.onUpdate(update);
    buf.start().catch(() => {});
    update();

    return () => {
      buf.close();
    };
  }, [project, config, terminalHeight, terminalWidth]);

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
      updateAutoScrollState(idx);
    } else if (key.upArrow && selectedIndex > 0) {
      const idx = selectedIndex - 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
      updateAutoScrollState(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        selectedIndex + pageSize
      );
      setSelectedIndex(idx);
      ensureVisible(idx);
      updateAutoScrollState(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, selectedIndex - pageSize);
      setSelectedIndex(idx);
      ensureVisible(idx);
      updateAutoScrollState(idx);
    } else if (input === 'g') {
      setSelectedIndex(0);
      ensureVisible(0);
      updateAutoScrollState(0);
    } else if (input === 'G') {
      const idx = filteredEntries.length - 1;
      setSelectedIndex(idx);
      ensureVisible(idx);
      updateAutoScrollState(idx);
    } else if (input === 'a') {
      setAutoScroll((s) => !s);
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
  const autoIndicator = ` [a] Auto:${autoScroll ? 'ON' : 'OFF'}`;

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
        ? `[↑↓] Navigate  [Enter] Detail  [PgUp/PgDn] Page  [g] Top  [G] Bottom  [f] Filter  [r] Refresh${autoIndicator}  [b] Back  [q] Quit`
        : `[↑↓] Navigate  [Enter] Detail  [f] Filter  [r] Refresh${autoIndicator}  [b] Back  [q] Quit`
    )
  );
};
