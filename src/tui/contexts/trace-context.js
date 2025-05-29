import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for managing trace selection state across components
 */
const TraceContext = createContext();

/**
 * Provider component for trace selection state
 * Manages selected trace, details view state, and restoration logic
 */
export function TraceProvider({ children }) {
  // Core selection state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);

  // Details view state
  const [detailsState, setDetailsState] = useState(null);

  /**
   * Update selection index and optionally sync timestamp
   * @param {number} index - New selected index
   * @param {Array} traces - Current traces array for timestamp sync
   */
  const updateSelectedIndex = useCallback((index, traces = null) => {
    setSelectedIndex(index);
    if (traces && traces[index]) {
      setSelectedTimestamp(traces[index].trace?.timestamp || null);
    }
  }, []);

  /**
   * Open details view with traces and current selection
   * @param {Array} traces - Array of trace entries
   * @param {number} currentIndex - Currently selected index
   */
  const openDetails = useCallback((traces, currentIndex) => {
    setDetailsState({ traces, currentIndex });
    if (traces[currentIndex]) {
      setSelectedTimestamp(traces[currentIndex].trace?.timestamp || null);
    }
  }, []);

  /**
   * Close details view and return to main log view
   */
  const closeDetails = useCallback(() => {
    setDetailsState(null);
  }, []);

  /**
   * Navigate within details view
   * @param {number} newIndex - New index to navigate to
   */
  const navigateDetails = useCallback((newIndex) => {
    setDetailsState((prev) => {
      if (!prev) return null;

      const newTrace = prev.traces[newIndex];
      if (newTrace) {
        setSelectedTimestamp(newTrace.trace?.timestamp || null);
      }

      return {
        ...prev,
        currentIndex: newIndex,
      };
    });
    setSelectedIndex(newIndex);
  }, []);

  /**
   * Restore selection after filtering operations
   * Attempts to find matching trace by timestamp, falls back to index bounds
   * @param {Array} filteredTraces - New filtered traces array
   */
  const restoreSelection = useCallback(
    (filteredTraces) => {
      if (!filteredTraces || filteredTraces.length === 0) {
        setSelectedIndex(0);
        return;
      }

      // Try to restore by timestamp if we have one
      if (selectedTimestamp) {
        const matchingIndex = filteredTraces.findIndex(
          (entry) => entry.trace?.timestamp === selectedTimestamp
        );

        if (matchingIndex !== -1) {
          setSelectedIndex(matchingIndex);
          return;
        }
      }

      // Fallback: ensure index is within bounds
      const newIndex = Math.min(selectedIndex, filteredTraces.length - 1);
      setSelectedIndex(Math.max(0, newIndex));
    },
    [selectedIndex, selectedTimestamp]
  );

  const value = {
    // Selection state
    selectedIndex,
    setSelectedIndex: updateSelectedIndex,
    scrollOffset,
    setScrollOffset,
    selectedTimestamp,
    setSelectedTimestamp,

    // Details view state
    detailsState,
    openDetails,
    closeDetails,
    navigateDetails,

    // Utilities
    restoreSelection,
  };

  return React.createElement(TraceContext.Provider, { value }, children);
}

/**
 * Hook to access trace selection context
 * @returns {Object} Trace selection state and methods
 * @throws {Error} If used outside TraceProvider
 */
export const useTraceSelection = () => {
  const context = useContext(TraceContext);
  if (!context) {
    throw new Error('useTraceSelection must be used within TraceProvider');
  }
  return context;
};
