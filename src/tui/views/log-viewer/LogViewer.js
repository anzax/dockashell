import React, { useEffect, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { TraceBuffer } from '../../utils/trace-buffer.js';
import { prepareEntry, findClosestTimestamp } from '../../utils/entry-utils.js';
import { TraceDetailsView } from '../trace-details/TraceDetailsView.js';
import { TraceTypesFilterView } from '../trace-types-filter/TraceTypesFilterView.js';
import { AppContainer } from '../AppContainer.js';
import { LineRenderer } from './LineRenderer.js';
import { useTraceBuffer } from '../../hooks/useTraceBuffer.js';
import { useFilters } from '../../hooks/useFilters.js';
import { useAutoScroll } from '../../hooks/useAutoScroll.js';
import { useStdoutDimensions } from '../../hooks/useStdoutDimensions.js';
import { useSelection } from '../../hooks/useSelection.js';

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
  (entry.height || 3) + (isSelected ? 2 : 0); // Height based on prepared entry

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [terminalWidth, terminalHeight] = useStdoutDimensions();
  const {
    filters,
    setFilters,
    lastFilterState,
    setLastFilterState,
    showFilterView,
    setShowFilterView,
    filtersRef,
  } = useFilters();
  const { entries, setEntries, buffer, setBuffer } = useTraceBuffer();
  const { autoScroll, setAutoScroll, autoScrollRef, updateAutoScrollState } =
    useAutoScroll();
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
    selectionBeforeFilter,
    setSelectionBeforeFilter,
    ensureVisible,
  } = useSelection(entries);

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

  // Handle filter changes separately from trace buffer updates
  useEffect(() => {
    // Check if filters actually changed
    const filtersChanged = Object.keys(filters).some(
      (key) => filters[key] !== lastFilterState[key]
    );

    if (!filtersChanged) return;

    // Capture current state from the STABLE entries array, not derived filteredEntries
    // This prevents race conditions where filteredEntries hasn't updated yet
    const currentFilteredEntry = filteredEntries[selectedIndex];
    if (currentFilteredEntry && entries.length > 0) {
      // Find the actual index in the main entries array
      const actualIndex = entries.findIndex(
        (e) => e.entry.timestamp === currentFilteredEntry.entry.timestamp
      );

      setSelectionBeforeFilter({
        timestamp: currentFilteredEntry.entry.timestamp,
        scrollOffset,
        selectedIndex,
        actualIndex,
        wasAtBottom: selectedIndex >= filteredEntries.length - 3,
      });
    }

    setLastFilterState(filters);
  }, [filters, lastFilterState, filteredEntries, selectedIndex, scrollOffset]);

  // Restore position after filter changes
  useEffect(() => {
    if (!selectionBeforeFilter) return;

    const {
      timestamp,
      scrollOffset: oldScrollOffset,
      wasAtBottom,
      actualIndex,
    } = selectionBeforeFilter;

    // This effect runs after filteredEntries has been updated
    // No need for setTimeout - React guarantees order

    if (filteredEntries.length === 0) {
      setSelectedIndex(0);
      setScrollOffset(0);
      setSelectionBeforeFilter(null);
      return;
    }

    // Find best matching entry
    let newSelectedIndex = -1;

    // Try exact timestamp match first
    if (timestamp) {
      newSelectedIndex = filteredEntries.findIndex(
        (entry) => entry.entry.timestamp === timestamp
      );
    }

    // Try closest timestamp if exact match not found
    if (newSelectedIndex === -1 && timestamp) {
      newSelectedIndex = findClosestTimestamp(filteredEntries, timestamp);
    }

    // Use proportional positioning as fallback
    if (newSelectedIndex === -1 && actualIndex >= 0 && entries.length > 0) {
      const proportion = actualIndex / entries.length;
      newSelectedIndex = Math.round(proportion * filteredEntries.length);
    }

    // Final fallback
    if (newSelectedIndex === -1) {
      newSelectedIndex = 0;
    }

    // Ensure within bounds
    newSelectedIndex = Math.max(
      0,
      Math.min(newSelectedIndex, filteredEntries.length - 1)
    );

    // Update selection first
    setSelectedIndex(newSelectedIndex);

    // Handle scroll position
    if (wasAtBottom && autoScroll) {
      // User was at bottom, maintain bottom position
      const lastIndex = filteredEntries.length - 1;
      const availableHeight = terminalHeight - 3;
      let totalHeight = 0;
      let visibleCount = 0;

      for (let i = lastIndex; i >= 0; i--) {
        const entryHeight = getEntryHeight(filteredEntries[i], i === lastIndex);
        if (totalHeight + entryHeight <= availableHeight) {
          totalHeight += entryHeight;
          visibleCount++;
        } else {
          break;
        }
      }

      const newScroll = Math.max(0, lastIndex - visibleCount + 1);
      setScrollOffset(newScroll);
      // Keep the calculated selection, don't override with lastIndex
    } else {
      // Calculate optimal scroll to keep selection centered
      const viewportHeight = Math.max(1, terminalHeight - 5);
      const halfViewport = Math.floor(viewportHeight / 2);

      // Try to center the selection
      let newScrollOffset = Math.max(0, newSelectedIndex - halfViewport);

      // But respect the old scroll position if selection is already visible
      const selectionVisible =
        newSelectedIndex >= oldScrollOffset &&
        newSelectedIndex < oldScrollOffset + viewportHeight;

      if (selectionVisible && oldScrollOffset < filteredEntries.length) {
        newScrollOffset = oldScrollOffset;
      }

      // Ensure within bounds
      newScrollOffset = Math.max(
        0,
        Math.min(
          newScrollOffset,
          Math.max(0, filteredEntries.length - viewportHeight)
        )
      );

      setScrollOffset(newScrollOffset);
    }

    // Clear restoration state
    setSelectionBeforeFilter(null);
  }, [
    filteredEntries,
    selectionBeforeFilter,
    autoScroll,
    terminalHeight,
    entries.length,
  ]);

  useEffect(() => {
    if (detailsViewIndex !== null) {
      detailsTimestampRef.current =
        filteredEntries[detailsViewIndex]?.entry.timestamp || null;
    }
  }, [detailsViewIndex, filteredEntries]);
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
      const prepared = raw.map((e) => prepareEntry(e, null, terminalWidth));

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

      // Only handle auto-scroll for new entries (filter changes handled separately)
      if (autoScrollRef.current && detailsViewRef.current === null) {
        const currentSelected = selectedIndexRef.current;
        const wasAtBottom = currentSelected >= filteredEntries.length - 1;

        if (wasAtBottom) {
          // User was following latest entries, continue doing so
          const newSelected = filtered.length - 1;
          setSelectedIndex(newSelected);

          const availableHeight = terminalHeight - 3;
          let totalHeight = 0;
          let visibleCount = 0;

          for (let i = filtered.length - 1; i >= 0; i--) {
            const entryHeight = getEntryHeight(filtered[i], i === newSelected);
            if (totalHeight + entryHeight <= availableHeight) {
              totalHeight += entryHeight;
              visibleCount++;
            } else {
              break;
            }
          }

          const newOffset = Math.max(0, filtered.length - 1 - visibleCount + 1);
          setScrollOffset(newOffset);
        }
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

    if (key.return) {
      setDetailsViewIndex(selectedIndex);
    } else if (key.downArrow && selectedIndex < filteredEntries.length - 1) {
      const idx = selectedIndex + 1;
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
      updateAutoScrollState(idx);
    } else if (key.upArrow && selectedIndex > 0) {
      const idx = selectedIndex - 1;
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
      updateAutoScrollState(idx);
    } else if (key.pageDown) {
      const idx = Math.min(
        filteredEntries.length - 1,
        selectedIndex + pageSize
      );
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
      updateAutoScrollState(idx);
    } else if (key.pageUp) {
      const idx = Math.max(0, selectedIndex - pageSize);
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
      updateAutoScrollState(idx);
    } else if (input === 'g') {
      setSelectedIndex(0);
      ensureVisibleWrapper(0);
      updateAutoScrollState(0);
    } else if (input === 'G') {
      const idx = filteredEntries.length - 1;
      setSelectedIndex(idx);
      ensureVisibleWrapper(idx);
      updateAutoScrollState(idx);
    } else if (input === 'a') {
      setAutoScroll((s) => !s);
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
  const autoIndicator = ` [a] Auto:${autoScroll ? 'ON' : 'OFF'}`;

  // Show filter view if requested
  if (showFilterView) {
    return React.createElement(TraceTypesFilterView, {
      currentFilters: filters,
      onBack: () => setShowFilterView(false),
      onApply: (newFilters) => {
        setFilters(newFilters);
        setShowFilterView(false);
        setSelectedIndex(0);
        setScrollOffset(0);
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
      hasMore
        ? `[↑↓] Navigate  [Enter] Detail  [PgUp/PgDn] Page  [g] Top  [G] Bottom [f] Filter  [r] Refresh${autoIndicator}  [b] Back  [q] Quit`
        : `[↑↓] Navigate  [Enter] Detail  [f] Filter  [r] Refresh${autoIndicator}  [b] Back  [q] Quit`
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
