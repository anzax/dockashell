import { atom } from 'nanostores';
import { $appConfig } from './config-store.js';
import { initTraceBuffer } from './trace-buffer-store.js';

export const $activeProject = atom(null);

export function setActiveProject(name) {
  $activeProject.set(name);
  const maxEntries = $appConfig.get().tui?.display?.max_entries || 100;
  initTraceBuffer(name, maxEntries);
}
