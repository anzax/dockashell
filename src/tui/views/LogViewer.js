import React, { useEffect, useState, useRef } from 'react';
import { Text, useInput } from 'ink';
import { useMouseInput } from '../hooks/use-mouse-input.js';
import { TraceBuffer } from '../ui-utils/trace-buffer.js';
import {
  detectTraceType,
  DEFAULT_FILTERS,
  findClosestIndexByTimestamp,
} from '../ui-utils/entry-utils.js';
import { AppContainer } from '../components/AppContainer.js';
import { TraceItemPreview } from '../components/TraceItemPreview.js';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';
import { useVirtualList } from '../hooks/useVirtualList.js';
import { ScrollableList } from '../components/ScrollableList.js';
import { SHORTCUTS, buildFooter } from '../ui-utils/constants.js';
import { isEnterKey } from '../ui-utils/text-utils.js';

export const getEntryHeight = (entry, isSelected, terminalWidth) =>
  TraceItemPreview.getHeight(entry.trace, isSelected, 'compact', terminalWidth);

export const LogViewer = ({
  project,
  onBack,
  onExit,
  config,
  onOpenDetails,
  onOpenFilter,
  filters = DEFAULT_FILTERS,
  selectedIndex: externalIndex,
  setSelectedIndex: setExternalIndex,
  scrollOffset: externalOffset,
  setScrollOffset: setExternalOffset,
  selectedTimestamp,
  setSelectedTimestamp,
}) => {
  const [terminalWidth] = useStdoutDimensions();
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const [buffer, setBuffer] = useState(null);
  const [entries, setEntries] = useState([]);

  // Filter entries based on current filters
  const filteredEntries = entries.filter((entry) => {
    const traceType = entry.traceType || 'unknown';
    return filters[traceType] !== false; // Show if filter is true or undefined
  });

  const list = useVirtualList({
    totalCount: filteredEntries.length,
    getItem: (idx) => filteredEntries[idx],
    getItemHeight: (item, selected) =>
      getEntryHeight(item, selected, terminalWidth),
    initialIndex: externalIndex,
    initialOffset: externalOffset,
  });

  const {
    selectedIndex,
    setSelectedIndex,
    ensureVisible,
    pageSize,
    visibleStart,
    visibleEnd,
    scrollOffset,
    setScrollOffset,
  } = list;

  useEffect(() => {
    if (selectedTimestamp) {
      const idx = findClosestIndexByTimestamp(
        filteredEntries,
        selectedTimestamp
      );
      setSelectedIndex(idx);
      ensureVisible(idx);
    }
  }, [selectedTimestamp, filteredEntries, setSelectedIndex, ensureVisible]);

  useEffect(() => {
    if (setExternalIndex) setExternalIndex(selectedIndex);
    if (setSelectedTimestamp) {
      const ts = filteredEntries[selectedIndex]?.trace.timestamp;
      if (ts) setSelectedTimestamp(ts);
    }
  }, [selectedIndex, setExternalIndex, setSelectedTimestamp, filteredEntries]);

  useEffect(() => {
    if (setExternalOffset) setExternalOffset(scrollOffset);
  }, [scrollOffset, setExternalOffset]);

  // Ensure selectedIndex is within bounds when filteredEntries changes
  useEffect(() => {
    if (filteredEntries.length === 0) {
      setSelectedIndex(0);
      setSelectedTimestamp?.(null);
    } else if (selectedIndex >= filteredEntries.length) {
      const idx = filteredEntries.length - 1;
      setSelectedIndex(idx);
      setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
    }
  }, [filteredEntries, selectedIndex, setSelectedIndex, setSelectedTimestamp]);

  // Load entries using TraceBuffer and update when buffer changes
  useEffect(() => {
    const buf = new TraceBuffer(project, config?.display?.max_entries || 100);
    setBuffer(buf);

    const update = () => {
      const raw = buf.getTraces();
      const prepared = raw.map((e) => ({
        trace: e,
        traceType: detectTraceType(e),
      }));

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

      let idx = selectedIndex;
      if (selectedTimestamp) {
        idx = findClosestIndexByTimestamp(filtered, selectedTimestamp);
      } else {
        idx = filtered.length - 1;
        setSelectedTimestamp?.(filtered[idx].trace.timestamp);
      }
      setSelectedIndex(idx);
      ensureVisible(idx);
    };

    buf.onUpdate(update);
    buf.start().catch(() => {});
    update();

    return () => {
      buf.close();
    };
  }, [project, config, terminalWidth]);

  // Input handling
  useInput((input, key) => {
    if (isEnterKey(key)) {
      setSelectedTimestamp?.(filteredEntries[selectedIndex]?.trace.timestamp);
      onOpenDetails?.({
        traces: filteredEntries,
        currentIndex: selectedIndex,
      });
    } else if (key.downArrow && selectedIndex < filteredEntries.length - 1) {
      const idx = selectedIndex + 1;
      setSelectedIndex(idx);
      setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
      ensureVisible(idx);
    } else if (key.upArrow && selectedIndex > 0) {
      const idx = selectedIndex - 1;
      setSelectedIndex(idx);
      setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
      ensureVisible(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        selectedIndex + pageSize()
      );
      setSelectedIndex(idx);
      setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
      ensureVisible(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, selectedIndex - pageSize());
      setSelectedIndex(idx);
      setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
      ensureVisible(idx);
    } else if (input === 'g') {
      setSelectedIndex(0);
      setSelectedTimestamp?.(filteredEntries[0]?.trace.timestamp);
      ensureVisible(0);
    } else if (input === 'G') {
      const idx = filteredEntries.length - 1;
      setSelectedIndex(idx);
      setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
      ensureVisible(idx);
    } else if (input === 'f') {
      onOpenFilter?.();
    } else if (input === 'r') {
      buffer?.refresh().catch(() => {});
    } else if (input === 'b') {
      onBack();
    } else if (input === 'q') {
      onExit();
    }
  });

  // Mouse handling
  useMouseInput((evt) => {
    if (evt.wheel === 'up') {
      if (selectedIndex > 0) {
        const idx = selectedIndex - 1;
        setSelectedIndex(idx);
        setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
        ensureVisible(idx);
      }
    } else if (evt.wheel === 'down') {
      if (selectedIndex < filteredEntries.length - 1) {
        const idx = selectedIndex + 1;
        setSelectedIndex(idx);
        setSelectedTimestamp?.(filteredEntries[idx].trace.timestamp);
        ensureVisible(idx);
      }
    } else if (evt.button === 'left' && !evt.isRelease) {
      const startRow = 2; // header + marginTop
      let r = evt.y - startRow;
      for (const { item, index } of list.visibleItems) {
        const h = getEntryHeight(item, index === selectedIndex, terminalWidth);
        if (r < h) {
          setSelectedIndex(index);
          setSelectedTimestamp?.(filteredEntries[index].trace.timestamp);
          ensureVisible(index);
          break;
        }
        r -= h;
      }
    }
  });

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
    children: React.createElement(ScrollableList, {
      list,
      renderItem: (entry, index, selected) =>
        React.createElement(TraceItemPreview, {
          key: `${entry.trace.timestamp}-${index}`,
          trace: entry.trace,
          selected,
          terminalWidth,
          mode: 'compact',
        }),
    }),
  });
};
