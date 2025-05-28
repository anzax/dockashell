import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { TraceBuffer } from '../../ui-utils/trace-buffer.js';
import { prepareEntry, DEFAULT_FILTERS } from '../../ui-utils/entry-utils.js';
import { AppContainer } from '../AppContainer.js';
import { LineRenderer } from './LineRenderer.js';
import { useStdoutDimensions } from '../../hooks/useStdoutDimensions.js';
import { useSelection } from '../../hooks/useSelection.js';
import { SHORTCUTS, buildFooter } from '../../constants/index.js';
import { isEnterKey } from '../../ui-utils/text-utils.js';

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

export const getEntryHeight = (entry, isSelected) =>
  (entry?.height || 3) + (isSelected ? 2 : 0); // Height based on prepared entry

export const LogViewer = ({
  project,
  onBack,
  onExit,
  config,
  onOpenDetails,
  onOpenFilter,
}) => {
  const [terminalWidth, terminalHeight] = useStdoutDimensions();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const [buffer, setBuffer] = useState(null);
  const [entries, setEntries] = useState([]);
  const {
    selectedIndex,
    setSelectedIndex,
    selectedIndexRef,
    selectedTimestampRef,
    scrollOffset,
    setScrollOffset,
    ensureVisible,
  } = useSelection(entries);

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

  // Ensure selectedIndex is within bounds when filteredEntries changes
  useEffect(() => {
    if (filteredEntries.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= filteredEntries.length) {
      setSelectedIndex(filteredEntries.length - 1);
    }
  }, [filteredEntries, selectedIndex, setSelectedIndex]);

  const ensureVisibleWrapper = useCallback(
    (index) =>
      ensureVisible(index, filteredEntries, terminalHeight, getEntryHeight),
    [ensureVisible, filteredEntries, terminalHeight]
  );

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
      const prepared = raw.map((e) => prepareEntry(e, terminalWidth));

      const filtered = prepared.filter((entry) => {
        const traceType = entry.traceType || 'unknown';
        return filtersRef.current[traceType] !== false;
      });

      setEntries(prepared);

      if (filtered.length === 0) {
        setSelectedIndex(0);
        setScrollOffset(0);
        return;
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
    const { start, end } = calculateVisibleEntries();
    const pageSize = end - start || 1;

    if (isEnterKey(key)) {
      onOpenDetails?.({
        traces: filteredEntries,
        currentIndex: selectedIndex,
        onNavigate: (newIndex) => setSelectedIndex(newIndex),
      });
    } else if (key.downArrow && selectedIndex < filteredEntries.length - 1) {
      const idx = selectedIndex + 1;
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
    } else if (key.upArrow && selectedIndex > 0) {
      const idx = selectedIndex - 1;
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        selectedIndex + pageSize
      );
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, selectedIndex - pageSize);
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
    } else if (input === 'g') {
      setSelectedIndex(0);
      ensureVisibleWrapper(0);
    } else if (input === 'G') {
      const idx = filteredEntries.length - 1;
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
    } else if (input === 'f') {
      onOpenFilter?.({
        currentFilters: filters,
        onApply: (newFilters) => setFilters(newFilters),
      });
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

  return React.createElement(AppContainer, {
    header: React.createElement(
      Text,
      { bold: true, wrap: 'truncate-end' },
      `DockaShell TUI - ${project}${scrollIndicator}`
    ),
    footer: React.createElement(
      Text,
      { dimColor: true, wrap: 'truncate-end' },
      buildFooter(
        SHORTCUTS.NAVIGATE,
        SHORTCUTS.DETAIL,
        SHORTCUTS.PAGE,
        SHORTCUTS.TOP_BOTTOM,
        SHORTCUTS.FILTER,
        SHORTCUTS.REFRESH,
        SHORTCUTS.BACK_B,
        SHORTCUTS.QUIT
      )
    ),
    children: React.createElement(
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
  });
};
