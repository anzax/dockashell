import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { TraceBuffer } from '../../ui-utils/trace-buffer.js';
import { prepareEntry, DEFAULT_FILTERS } from '../../ui-utils/entry-utils.js';
import { TraceDetailsView } from '../trace-details/TraceDetailsView.js';
import { TraceTypesFilterView } from '../trace-types-filter/TraceTypesFilterView.js';
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

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [terminalWidth, terminalHeight] = useStdoutDimensions();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilterView, setShowFilterView] = useState(false);
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
    detailsViewIndex,
    setDetailsViewIndex,
    detailsViewRef,
    detailsTimestampRef,
    ensureVisible,
  } = useSelection(entries);

  // Keep refs synced with state for callbacks
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
    if (detailsViewIndex !== null) {
      detailsTimestampRef.current =
        filteredEntries[detailsViewIndex]?.entry.timestamp || null;
    }
  }, [detailsViewIndex, filteredEntries]);

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

      // Handle details view restoration
      let newDetailsIndex = null;
      if (detailsViewRef.current !== null) {
        if (filtered.length === 0) {
          newDetailsIndex = null;
        } else {
          newDetailsIndex = filtered.findIndex(
            (e) => e.entry.timestamp === detailsTimestampRef.current
          );
          if (newDetailsIndex === -1) {
            newDetailsIndex = Math.min(
              detailsViewRef.current,
              filtered.length - 1
            );
          }
        }
        setDetailsViewIndex(
          newDetailsIndex === null ? null : Math.max(0, newDetailsIndex)
        );
      }

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
    // Skip input handling when details view is open (it handles its own input)
    if (detailsViewIndex !== null || showFilterView) return;

    const { start, end } = calculateVisibleEntries();
    const pageSize = end - start || 1;

    if (isEnterKey(key)) {
      setDetailsViewIndex(selectedIndex);
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
      setShowFilterView(true);
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

  // Show filter view if requested
  if (showFilterView) {
    return React.createElement(TraceTypesFilterView, {
      currentFilters: filters,
      onBack: () => setShowFilterView(false),
      onApply: (newFilters) => {
        setFilters(newFilters);
        setShowFilterView(false);
      },
    });
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
    });
  }

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
