import { atom, computed, map } from 'nanostores';
import { TraceBuffer } from '../ui-utils/trace-buffer.js';
import { detectTraceType } from '../ui-utils/entry-utils.js';
import { $traceFilters } from './filter-store.js';

export const $traceBuffer = atom(null);
export const $traceEntries = atom([]);

export const $filteredEntries = computed(
  [$traceEntries, $traceFilters],
  (entries, filters) =>
    entries.filter((entry) => {
      const type = detectTraceType(entry.trace);
      return filters[type] !== false;
    })
);

export const $traceState = map({
  selectedIndex: 0,
  scrollOffset: 0,
  selectedTimestamp: null,
});

export const $traceData = computed(
  [$traceEntries, $filteredEntries, $traceState],
  (entries, filtered, state) => ({
    entries,
    filteredEntries: filtered,
    selectedIndex: state.selectedIndex,
    scrollOffset: state.scrollOffset,
    selectedTimestamp: state.selectedTimestamp,
  })
);

let activeProject = null;
let unsubscribe = null;

export async function initTraceBuffer(project, maxEntries = 100) {
  if (project === activeProject && $traceBuffer.get()) {
    return;
  }

  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  const prev = $traceBuffer.get();
  if (prev) {
    await prev.close().catch(() => {});
  }

  activeProject = project;
  if (!project) {
    $traceBuffer.set(null);
    $traceEntries.set([]);
    return;
  }

  const buffer = new TraceBuffer(project, maxEntries);
  $traceBuffer.set(buffer);

  const update = () => {
    const raw = buffer.getTraces();
    $traceEntries.set(raw.map((e) => ({ trace: e })));
  };

  unsubscribe = buffer.onUpdate(update);
  buffer.start().catch(() => {});
  update();
}
