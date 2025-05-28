import React, { useState, useEffect } from 'react';
import { ProjectSelector } from './views/ProjectSelector.js';
import { LogViewer } from './views/LogViewer.js';
import { TraceDetailsView } from './views/TraceDetailsView.js';
import { TraceTypesFilterView } from './views/TraceTypesFilterView.js';
import { loadConfig } from '../utils/config.js';

const defaultTuiConfig = {
  display: {
    max_entries: 100,
  },
};

export const App = ({ projectArg }) => {
  const [project, setProject] = useState(projectArg || null);
  const [config, setConfig] = useState({ tui: defaultTuiConfig });
  const [filterState, setFilterState] = useState(null);
  const [detailsState, setDetailsState] = useState(null);

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

  if (filterState) {
    return React.createElement(TraceTypesFilterView, {
      currentFilters: filterState.currentFilters,
      onBack: () => setFilterState(null),
      onApply: (newFilters) => {
        filterState.onApply(newFilters);
        setFilterState(null);
      },
    });
  }

  if (detailsState) {
    return React.createElement(TraceDetailsView, {
      traces: detailsState.traces,
      currentIndex: detailsState.currentIndex,
      onClose: () => setDetailsState(null),
      onNavigate: (idx) => {
        detailsState.onNavigate(idx);
        setDetailsState((prev) => ({ ...prev, currentIndex: idx }));
      },
    });
  }

  return React.createElement(LogViewer, {
    project,
    config: config.tui || defaultTuiConfig,
    onBack: () => setProject(null),
    onExit: () => process.exit(0),
    onOpenDetails: ({ traces, currentIndex, onNavigate }) =>
      setDetailsState({ traces, currentIndex, onNavigate }),
    onOpenFilter: ({ currentFilters, onApply }) =>
      setFilterState({ currentFilters, onApply }),
  });
};
