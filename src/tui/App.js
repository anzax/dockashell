import React, { useState, useEffect } from 'react';
import { useTerminalMouseMode } from './hooks/useTerminalMouseMode.js';
import { ProjectSelector } from './views/ProjectSelector.js';
import { LogViewer } from './views/LogViewer.js';
import { TraceDetailsView } from './views/TraceDetailsView.js';
import { TraceTypesFilterView } from './views/TraceTypesFilterView.js';
import { loadConfig } from '../utils/config.js';
import { DEFAULT_FILTERS } from './ui-utils/entry-utils.js';
import { AppContext } from './app-context.js';

const defaultTuiConfig = {
  display: {
    max_entries: 100,
  },
};

export const App = ({ projectArg }) => {
  // Enable mouse mode for the entire application
  useTerminalMouseMode();

  const [project, setProject] = useState(projectArg || null);
  const [config, setConfig] = useState({ tui: defaultTuiConfig });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedTimestamp, setSelectedTimestamp] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailsState, setDetailsState] = useState(null);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(() => {
        // keep default config on error
      });
  }, []);

  const contextValue = {
    project,
    setProject,
    config: config.tui || defaultTuiConfig,
    setConfig,
    filters,
    setFilters,
    selectedIndex,
    setSelectedIndex,
    scrollOffset,
    setScrollOffset,
    selectedTimestamp,
    setSelectedTimestamp,
    openFilter: () => setFilterOpen(true),
    closeFilter: () => setFilterOpen(false),
    openDetails: ({ traces, currentIndex }) => {
      setSelectedTimestamp(traces[currentIndex]?.trace.timestamp || null);
      setDetailsState({ traces, currentIndex });
    },
    updateDetailsIndex: (idx) => {
      setDetailsState((prev) => {
        if (!prev) return prev;
        const ts = prev.traces[idx]?.trace.timestamp;
        setSelectedTimestamp(ts || null);
        return { ...prev, currentIndex: idx };
      });
      setSelectedIndex(idx);
    },
    closeDetails: () => setDetailsState(null),
    backToProjects: () => setProject(null),
    exitApp: () => process.exit(0),
    detailsState,
    filterOpen,
  };

  let view = null;
  if (!project) {
    view = React.createElement(ProjectSelector, {
      onSelect: setProject,
      onExit: () => process.exit(0),
    });
  } else if (filterOpen) {
    view = React.createElement(TraceTypesFilterView);
  } else if (detailsState) {
    view = React.createElement(TraceDetailsView);
  } else {
    view = React.createElement(LogViewer);
  }

  return React.createElement(
    AppContext.Provider,
    { value: contextValue },
    view
  );
};
