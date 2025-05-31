import React, { useState, useEffect } from 'react';
import { TraceProvider, useTraceSelection } from './contexts/trace-context.js';
import { useTerminalMouseMode } from './hooks/use-terminal-mouse-mode.js';
import { ProjectSelector } from './views/project-selector.js';
import { LogViewer } from './views/log-viewer.js';
import { TraceDetailsView } from './views/trace-details-view.js';
import { TraceTypesFilterView } from './views/trace-types-filter-view.js';
import { useStore } from '@nanostores/react';
import { $activeProject, setActiveProject } from './stores/project-store.js';
import { $appConfig } from './stores/config-store.js';
import { $traceFilters } from './stores/filter-store.js';

/**
 * Main application component that uses trace context
 */
const MainApp = ({ projectArg }) => {
  // Enable mouse mode for the entire application
  useTerminalMouseMode();

  // Get trace selection state from context
  const { detailsState, openDetails, closeDetails, navigateDetails } =
    useTraceSelection();

  const project = useStore($activeProject);
  useStore($appConfig); // ensure re-render on config change
  useStore($traceFilters); // ensure re-render on filter change
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (projectArg) {
      setActiveProject(projectArg);
    }
  }, [projectArg]);

  if (!project) {
    return React.createElement(ProjectSelector, {
      onExit: () => process.exit(0),
    });
  }

  if (filterOpen) {
    return React.createElement(TraceTypesFilterView, {
      onBack: () => setFilterOpen(false),
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
    onBack: () => setActiveProject(null),
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
