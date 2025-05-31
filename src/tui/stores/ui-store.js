import { map } from 'nanostores';
import { dispatch as traceDispatch } from './trace-selection-store.js';
import { setActiveProject } from './project-store.js';

export const $uiState = map({ activeView: 'selector' });

export function dispatch(action) {
  const { activeView } = $uiState.get();
  switch (action.type) {
    case 'set-view':
      $uiState.setKey('activeView', action.view);
      break;
    case 'close-details':
      traceDispatch({ type: 'close-details' });
      $uiState.setKey('activeView', 'log');
      break;
    case 'back':
      if (activeView === 'details') {
        traceDispatch({ type: 'close-details' });
        $uiState.setKey('activeView', 'log');
      } else if (activeView === 'filter') {
        $uiState.setKey('activeView', 'log');
      } else if (activeView === 'log') {
        setActiveProject(null);
        $uiState.setKey('activeView', 'selector');
      } else if (activeView === 'selector') {
        process.exit(0);
      }
      break;
    case 'quit':
      process.exit(0);
      break;
    default:
      break;
  }
}

export function setActiveView(view) {
  dispatch({ type: 'set-view', view });
}
