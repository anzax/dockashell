import React, { useEffect, useState, useRef } from 'react';
import { Text, useInput } from 'ink';
import { useStore } from '@nanostores/react';
import { useTraceSelection } from '../contexts/trace-context.js';
import { $activeProject } from '../stores/project-store.js';
import { $appConfig } from '../stores/config-store.js';
import { $traceFilters } from '../stores/filter-store.js';
import { useMouseInput } from '../hooks/use-mouse-input.js';
import { TraceBuffer } from '../ui-utils/trace-buffer.js';
import {
  detectTraceType,
  findClosestIndexByTimestamp,
} from '../ui-utils/entry-utils.js';
import { AppContainer } from '../components/app-container.js';
import { TraceItemPreview } from '../components/trace-item-preview.js';
import { useStdoutDimensions } from '../hooks/use-stdout-dimensions.js';
import { useVirtualList } from '../hooks/use-virtual-list.js';
import { ScrollableList } from '../components/scrollable-list.js';
import { SHORTCUTS, buildFooter } from '../ui-utils/constants.js';
import { isEnterKey } from '../ui-utils/text-utils.js';

export const getEntryHeight = (entry, isSelected) =>
  TraceItemPreview.getHeight(entry.trace, isSelected);

export const LogViewer = ({ onBack, onExit, onOpenDetails, onOpenFilter }) => {
  // Get selection state from store
  const {
    state: { selectedIndex, scrollOffset, selectedTimestamp },
    dispatch,
  } = useTraceSelection();

  const project = useStore($activeProject);
  const appConfig = useStore($appConfig);
  const filters = useStore($traceFilters);

  const [terminalWidth] = useStdoutDimensions();
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const [buffer, setBuffer] = useState(null);
  const [entries, setEntries] = useState([]);

  // Filter entries based on current filters
  const filteredEntries = entries.filter((entry) => {
    const traceType = detectTraceType(entry.trace);
    return filters[traceType] !== false; // Show if filter is true or undefined
  });

  const list = useVirtualList({
    totalCount: filteredEntries.length,
    getItem: (idx) => filteredEntries[idx],
    getItemHeight: (item, selected) => getEntryHeight(item, selected),
    initialIndex: selectedIndex,
    initialOffset: scrollOffset,
  });

  const {
    selectedIndex: listSelectedIndex,
    setSelectedIndex: setListSelectedIndex,
    ensureVisible,
    pageSize,
    visibleStart,
    visibleEnd,
    scrollOffset: listScrollOffset,
    setScrollOffset: setListScrollOffset,
  } = list;

  // Sync context changes to virtual list (during restoration)
  useEffect(() => {
    if (selectedIndex !== listSelectedIndex) {
      setListSelectedIndex(selectedIndex);
      ensureVisible(selectedIndex);
    }
    if (scrollOffset !== listScrollOffset) {
      setListScrollOffset(scrollOffset);
    }
  }, [
    selectedIndex,
    listSelectedIndex,
    setListSelectedIndex,
    ensureVisible,
    scrollOffset,
    listScrollOffset,
    setListScrollOffset,
  ]);
  useEffect(() => {
    if (selectedTimestamp) {
      const idx = findClosestIndexByTimestamp(
        filteredEntries,
        selectedTimestamp
      );
      setListSelectedIndex(idx);
      ensureVisible(idx);
    }
  }, [selectedTimestamp, filteredEntries, ensureVisible]);

  // Update timestamp when selection changes
  // Restore selection when filters change
  useEffect(() => {
    dispatch({ type: 'restore-selection', traces: filteredEntries });
  }, [filteredEntries, dispatch]);

  // Load entries using TraceBuffer and update when buffer changes
  useEffect(() => {
    const buf = new TraceBuffer(
      project,
      appConfig.tui?.display?.max_entries || 100
    );
    setBuffer(buf);

    const update = () => {
      const raw = buf.getTraces();
      const prepared = raw.map((e) => ({ trace: e }));
      setEntries(prepared);

      // Apply filters to get current filtered count
      const filtered = prepared.filter((entry) => {
        const traceType = detectTraceType(entry.trace);
        return filtersRef.current[traceType] !== false;
      });

      if (filtered.length === 0) {
        dispatch({ type: 'set-index', index: 0 });
        dispatch({ type: 'set-scroll', offset: 0 });
        return;
      }

      let idx = selectedIndex;
      if (selectedTimestamp) {
        idx = findClosestIndexByTimestamp(filtered, selectedTimestamp);
      } else {
        idx = filtered.length - 1;
        dispatch({
          type: 'set-timestamp',
          timestamp: filtered[idx].trace.timestamp,
        });
      }
      setListSelectedIndex(idx);
      ensureVisible(idx);
    };

    buf.onUpdate(update);
    buf.start().catch(() => {});
    update();

    return () => {
      buf.close();
    };
  }, [project, appConfig, terminalWidth]);

  // Input handling
  useInput((input, key) => {
    if (isEnterKey(key)) {
      dispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[listSelectedIndex]?.trace.timestamp,
      });
      onOpenDetails?.({
        traces: filteredEntries,
        currentIndex: listSelectedIndex,
      });
    } else if (
      key.downArrow &&
      listSelectedIndex < filteredEntries.length - 1
    ) {
      const idx = listSelectedIndex + 1;
      setListSelectedIndex(idx);
      dispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (key.upArrow && listSelectedIndex > 0) {
      const idx = listSelectedIndex - 1;
      setListSelectedIndex(idx);
      dispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        listSelectedIndex + pageSize()
      );
      setListSelectedIndex(idx);
      dispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, listSelectedIndex - pageSize());
      setListSelectedIndex(idx);
      dispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
      ensureVisible(idx);
    } else if (input === 'g') {
      dispatch({ type: 'set-index', index: 0, traces: filteredEntries });
      ensureVisible(0);
    } else if (input === 'G') {
      const idx = filteredEntries.length - 1;
      setListSelectedIndex(idx);
      dispatch({
        type: 'set-timestamp',
        timestamp: filteredEntries[idx].trace.timestamp,
      });
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
      if (listSelectedIndex > 0) {
        const idx = listSelectedIndex - 1;
        setListSelectedIndex(idx);
        dispatch({
          type: 'set-timestamp',
          timestamp: filteredEntries[idx].trace.timestamp,
        });
        ensureVisible(idx);
      }
    } else if (evt.wheel === 'down') {
      if (listSelectedIndex < filteredEntries.length - 1) {
        const idx = listSelectedIndex + 1;
        setListSelectedIndex(idx);
        dispatch({
          type: 'set-timestamp',
          timestamp: filteredEntries[idx].trace.timestamp,
        });
        ensureVisible(idx);
      }
    } else if (evt.button === 'left' && !evt.isRelease) {
      const startRow = 2; // header + marginTop
      let r = evt.y - startRow;
      for (const { item, index } of list.visibleItems) {
        const h = getEntryHeight(item, index === listSelectedIndex);
        if (r < h) {
          dispatch({ type: 'set-index', index, traces: filteredEntries });
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
        }),
    }),
  });
};
