import React, { useEffect } from 'react';
import { Text, useInput } from 'ink';
import { useStore } from '@nanostores/react';
import { dispatch as traceDispatch } from '../stores/trace-selection-store.js';
import { $traceData } from '../stores/trace-buffer-store.js';
import { $activeProject } from '../stores/project-store.js';
import { $traceFilters } from '../stores/filter-store.js';
import { $traceBuffer } from '../stores/trace-buffer-store.js';
import { findClosestIndexByTimestamp } from '../ui-utils/entry-utils.js';
import { AppContainer } from '../components/app-container.js';
import { TraceItemPreview } from '../components/trace-item-preview.js';
import { useStdoutDimensions } from '../hooks/use-stdout-dimensions.js';
import { useVirtualList } from '../hooks/use-virtual-list.js';
import { ScrollableList } from '../components/scrollable-list.js';
import { dispatch as uiDispatch } from '../stores/ui-store.js';
import { isEnterKey } from '../ui-utils/text-utils.js';

export const getEntryHeight = (isSelected) => 3 + (isSelected ? 2 : 0);

export const LogViewer = () => {
  // Get selection state from store
  const { selectedIndex, scrollOffset, selectedTimestamp, filteredEntries } =
    useStore($traceData);

  const project = useStore($activeProject);
  const filters = useStore($traceFilters);
  const buffer = useStore($traceBuffer);

  const [terminalWidth] = useStdoutDimensions();

  const list = useVirtualList({
    totalCount: filteredEntries.length,
    getItem: (idx) => filteredEntries[idx],
    getItemHeight: (_, selected) => getEntryHeight(selected),
    selectedIndex,
    scrollOffset,
    onSelectionChange: (idx) =>
      traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries }),
    onScrollChange: (off) => traceDispatch({ type: 'set-scroll', offset: off }),
  });

  const {
    selectedIndex: listSelectedIndex,
    ensureVisible,
    pageSize,
    visibleStart,
    visibleEnd,
  } = list;

  // Restore selection and ensure visibility
  useEffect(() => {
    if (filteredEntries.length === 0) {
      traceDispatch({ type: 'set-index', index: 0 });
      traceDispatch({ type: 'set-scroll', offset: 0 });
      return;
    }

    let idx = selectedIndex;
    if (selectedTimestamp) {
      idx = findClosestIndexByTimestamp(filteredEntries, selectedTimestamp);
    } else {
      idx = filteredEntries.length - 1;
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
    }

    traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries });

    ensureVisible(idx);
  }, [filteredEntries, selectedTimestamp, selectedIndex, ensureVisible]);

  // Input handling
  useInput((input, key) => {
    if (isEnterKey(key)) {
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[listSelectedIndex]?.trace.timestamp,
      });
      traceDispatch({
        type: 'open-details',
        index: listSelectedIndex,
      });
      uiDispatch({ type: 'set-view', view: 'details' });
    } else if (
      key.downArrow &&
      listSelectedIndex < filteredEntries.length - 1
    ) {
      const idx = listSelectedIndex + 1;
      traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries });
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (key.upArrow && listSelectedIndex > 0) {
      const idx = listSelectedIndex - 1;
      traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries });
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        listSelectedIndex + pageSize()
      );
      traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries });
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, listSelectedIndex - pageSize());
      traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries });
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (input === 'g') {
      traceDispatch({ type: 'set-index', index: 0, traces: filteredEntries });
      ensureVisible(0);
    } else if (input === 'G') {
      const idx = filteredEntries.length - 1;
      traceDispatch({ type: 'set-index', index: idx, traces: filteredEntries });
      traceDispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (input === 'f') {
      uiDispatch({ type: 'set-view', view: 'filter' });
    } else if (input === 'r') {
      buffer?.refresh().catch(() => {});
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
    children: React.createElement(ScrollableList, {
      list,
      renderItem: (entry, index, selected) =>
        React.createElement(TraceItemPreview, {
          key: `${entry.trace.timestamp}-${index}`,
          trace: entry.trace,
          selected,
          terminalWidth,
        }),
    }),
  });
};
