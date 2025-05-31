import { map } from 'nanostores';
import { $filteredEntries, $traceState } from './trace-buffer-store.js';

export const $traceSelection = map({
  detailsState: null,
});

export function dispatch(action) {
  const state = $traceSelection.get();
  switch (action.type) {
    case 'set-index': {
      const { index, traces } = action;
      $traceState.setKey('selectedIndex', index);
      if (traces && traces[index]) {
        $traceState.setKey(
          'selectedTimestamp',
          traces[index].trace?.timestamp || null
        );
      }
      break;
    }
    case 'set-scroll':
      $traceState.setKey('scrollOffset', action.offset);
      break;
    case 'set-timestamp':
      $traceState.setKey('selectedTimestamp', action.timestamp);
      break;
    case 'open-details': {
      const { index } = action;
      const traces = $filteredEntries.get();
      $traceSelection.setKey('detailsState', { currentIndex: index });
      if (traces[index]) {
        $traceState.setKey(
          'selectedTimestamp',
          traces[index].trace?.timestamp || null
        );
      }
      $traceState.setKey('selectedIndex', index);
      break;
    }
    case 'close-details':
      $traceSelection.setKey('detailsState', null);
      break;
    case 'navigate-details': {
      const prev = state.detailsState;
      if (!prev) break;
      const { index } = action;
      const traces = $filteredEntries.get();
      if (traces[index]) {
        $traceState.setKey(
          'selectedTimestamp',
          traces[index].trace?.timestamp || null
        );
      }
      $traceSelection.setKey('detailsState', {
        ...prev,
        currentIndex: index,
      });
      $traceState.setKey('selectedIndex', index);
      break;
    }
    case 'restore-selection': {
      const traces = action.traces;
      if (!traces || traces.length === 0) {
        dispatch({ type: 'set-index', index: 0 });
        break;
      }
      const { selectedIndex, selectedTimestamp } = $traceState.get();
      if (selectedTimestamp) {
        const matchingIndex = traces.findIndex(
          (e) => e.trace?.timestamp === selectedTimestamp
        );
        if (matchingIndex !== -1) {
          dispatch({ type: 'set-index', index: matchingIndex, traces });
          break;
        }
      }
      const newIndex = Math.min(selectedIndex, traces.length - 1);
      dispatch({
        type: 'set-index',
        index: Math.max(0, newIndex),
        traces,
      });
      break;
    }
    default:
      break;
  }
}

export function resetTraceSelection() {
  $traceState.set({
    selectedIndex: 0,
    scrollOffset: 0,
    selectedTimestamp: null,
  });
  $traceSelection.set({
    detailsState: null,
  });
}
