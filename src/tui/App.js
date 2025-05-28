import React, { useState, useEffect } from 'react';
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

export const App = ({ projectArg }) => {
  const [project, setProject] = useState(projectArg || null);
  const [config, setConfig] = useState({ tui: defaultTuiConfig });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
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
      onClose: () => setDetailsState(null),
      onNavigate: (idx) => {
        setDetailsState((prev) => ({ ...prev, currentIndex: idx }));
        setSelectedIndex(idx);
      },
    });
  }

  return React.createElement(LogViewer, {
    project,
    config: config.tui || defaultTuiConfig,
    filters,
    selectedIndex,
    setSelectedIndex,
    scrollOffset,
    setScrollOffset,
    onBack: () => setProject(null),
    onExit: () => process.exit(0),
    onOpenDetails: ({ traces, currentIndex }) =>
      setDetailsState({ traces, currentIndex }),
    onOpenFilter: () => setFilterOpen(true),
  });
};
