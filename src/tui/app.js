import React, { useEffect } from 'react';
import { useTerminalMouseMode } from './hooks/use-terminal-mouse-mode.js';
import { useGlobalKeys } from './hooks/use-global-keys.js';
import { ProjectSelector } from './views/project-selector.js';
import { LogViewer } from './views/log-viewer.js';
import { TraceDetailsView } from './views/trace-details-view.js';
import { TraceTypesFilterView } from './views/trace-types-filter-view.js';
import { useStore } from '@nanostores/react';
import { $activeProject, setActiveProject } from './stores/project-store.js';
import { $appConfig } from './stores/config-store.js';
import { $traceFilters } from './stores/filter-store.js';
import { $uiState, dispatch as uiDispatch } from './stores/ui-store.js';

/**
 * Main application component that uses trace context
 */
const MainApp = ({ projectArg }) => {
  // Enable mouse mode for the entire application
  useTerminalMouseMode();
  useGlobalKeys();

  const project = useStore($activeProject);
  useStore($appConfig); // ensure re-render on config change
  useStore($traceFilters); // ensure re-render on filter change
  const { activeView } = useStore($uiState);

  useEffect(() => {
    if (projectArg) {
      setActiveProject(projectArg);
    }
  }, [projectArg]);

  useEffect(() => {
    if (project) {
      uiDispatch({ type: 'set-view', view: 'log' });
    } else {
      uiDispatch({ type: 'set-view', view: 'selector' });
    }
  }, [project]);

  if (!project) {
    return React.createElement(ProjectSelector);
  }

  if (activeView === 'filter') {
    return React.createElement(TraceTypesFilterView);
  }

  if (activeView === 'details') {
    return React.createElement(TraceDetailsView);
  }

  return React.createElement(LogViewer, null);
};

/**
 * Root App component that provides trace selection context
 */
export const App = ({ projectArg }) => {
  return React.createElement(MainApp, { projectArg });
};
