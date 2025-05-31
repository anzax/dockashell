import { useStore } from '@nanostores/react';
import { $traceSelection, dispatch } from '../stores/trace-selection-store.js';

export function useTraceSelection() {
  const state = useStore($traceSelection);
  return { state, dispatch };
}
