import { atom } from 'nanostores';
import { DEFAULT_FILTERS } from '../ui-utils/entry-utils.js';

export const $traceFilters = atom({ ...DEFAULT_FILTERS });

export function setTraceFilters(filters) {
  $traceFilters.set(filters);
}
