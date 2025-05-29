import React, { useState, useEffect } from 'react';
import { TraceProvider, useTraceSelection } from './contexts/trace-context.js';
import { useTerminalMouseMode } from './hooks/useTerminalMouseMode.js';
import { ProjectSelector } from './views/ProjectSelector.js';
import { LogViewer } from './views/LogViewer.js';
import { TraceDetailsView } from './views/TraceDetailsView.js';
import { TraceTypesFilterView } from './views/TraceTypesFilterView.js';
import { loadConfig } from '../utils/config.js';
import { DEFAULT_FILTERS } from './ui-utils/entry-utils.js';

const defaultTuiConfig = {
  display: {
    max_entries: 100,
  },
};

/**
 * Main application component that uses trace context
 */
const MainApp = ({ projectArg }) => {
  // Enable mouse mode for the entire application
  useTerminalMouseMode();

  // Get trace selection state from context
  const { detailsState, openDetails, closeDetails, navigateDetails } =
    useTraceSelection();

  const [project, setProject] = useState(projectArg || null);
  const [config, setConfig] = useState({ tui: defaultTuiConfig });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    loadConfig()
      .then(setConfig)
      .catch(() => {
        // keep default config on error
      });
  }, []);

  if (!project) {
    return React.createElement(ProjectSelector, {
      onSelect: setProject,
      onExit: () => process.exit(0),
    });
  }

  if (filterOpen) {
    return React.createElement(TraceTypesFilterView, {
      currentFilters: filters,
      onBack: () => setFilterOpen(false),
      onApply: (newFilters) => {
        setFilters(newFilters);
        setFilterOpen(false);
      },
    });
  }

  if (detailsState) {
    return React.createElement(TraceDetailsView, {
      traces: detailsState.traces,
      currentIndex: detailsState.currentIndex,
      onClose: closeDetails,
      onNavigate: navigateDetails,
    });
  }

  return React.createElement(LogViewer, {
    project,
    config: config.tui || defaultTuiConfig,
    filters,
    onBack: () => setProject(null),
    onExit: () => process.exit(0),
    onOpenDetails: ({ traces, currentIndex }) =>
      openDetails(traces, currentIndex),
    onOpenFilter: () => setFilterOpen(true),
  });
};

/**
 * Root App component that provides trace selection context
 */
export const App = ({ projectArg }) => {
  return React.createElement(
    TraceProvider,
    null,
    React.createElement(MainApp, { projectArg })
  );
};
