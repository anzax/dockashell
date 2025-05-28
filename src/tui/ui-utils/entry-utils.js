import { TRACE_TYPES } from './constants.js';

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'No timestamp';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid timestamp';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const TRACE_TYPE_DETECTORS = {
  command: (e) => e.kind === 'command' || e.command,
  apply_patch: (e) => e.kind === 'apply_patch' || e.patch,
  write_file: (e) => e.kind === 'write_file',
  user: (e) => e.noteType === 'user',
  agent: (e) => e.noteType === 'agent',
  summary: (e) => e.noteType === 'summary',
};

export const detectTraceType = (entry) => {
  if (!entry) return TRACE_TYPES.UNKNOWN;
  for (const [type, detector] of Object.entries(TRACE_TYPE_DETECTORS)) {
    if (detector(entry)) return type;
  }
  if (entry.noteType) return entry.noteType;
  if (entry.type) return entry.type;
  return TRACE_TYPES.UNKNOWN;
};

export const DEFAULT_FILTERS = {
  user: true,
  agent: true,
  summary: true,
  command: true,
  apply_patch: true,
  write_file: true,
};
