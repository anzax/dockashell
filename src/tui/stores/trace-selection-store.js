import { map } from 'nanostores';

export const $traceSelection = map({
  selectedIndex: 0,
  scrollOffset: 0,
  selectedTimestamp: null,
  detailsState: null,
});

export function dispatch(action) {
  const state = $traceSelection.get();
  switch (action.type) {
    case 'set-index': {
      const { index, traces } = action;
      $traceSelection.setKey('selectedIndex', index);
      if (traces && traces[index]) {
        $traceSelection.setKey(
          'selectedTimestamp',
          traces[index].trace?.timestamp || null
        );
      }
      break;
    }
    case 'set-scroll':
      $traceSelection.setKey('scrollOffset', action.offset);
      break;
    case 'set-timestamp':
      $traceSelection.setKey('selectedTimestamp', action.timestamp);
      break;
    case 'open-details': {
      const { traces, index } = action;
      $traceSelection.setKey('detailsState', { traces, currentIndex: index });
      if (traces[index]) {
        $traceSelection.setKey(
          'selectedTimestamp',
          traces[index].trace?.timestamp || null
        );
      }
      $traceSelection.setKey('selectedIndex', index);
      break;
    }
    case 'close-details':
      $traceSelection.setKey('detailsState', null);
      break;
    case 'navigate-details': {
      const prev = state.detailsState;
      if (!prev) break;
      const { index } = action;
      const newTrace = prev.traces[index];
      if (newTrace) {
        $traceSelection.setKey(
          'selectedTimestamp',
          newTrace.trace?.timestamp || null
        );
      }
      $traceSelection.setKey('detailsState', {
        ...prev,
        currentIndex: index,
      });
      $traceSelection.setKey('selectedIndex', index);
      break;
    }
    case 'restore-selection': {
      const traces = action.traces;
      if (!traces || traces.length === 0) {
        dispatch({ type: 'set-index', index: 0 });
        break;
      }
      const { selectedIndex, selectedTimestamp } = state;
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
  $traceSelection.set({
    selectedIndex: 0,
    scrollOffset: 0,
    selectedTimestamp: null,
    detailsState: null,
  });
}
