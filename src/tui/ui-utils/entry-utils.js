import { getDecorator } from '../event-decorators/index.js';
import { TextLayout } from './text-utils.js';
import { TRACE_TYPES, LAYOUT } from './constants.js';

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'No timestamp';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid timestamp';
  // Format as YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Kept for backwards compatibility

// Helper to determine the high level trace type
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
  // Legacy note handling - try to detect noteType
  if (entry.noteType) return entry.noteType;
  if (entry.type) return entry.type; // legacy notes
  return TRACE_TYPES.UNKNOWN;
};

// Icon mapping for all supported trace types
// Icon and color mappings moved to constants

export const DEFAULT_FILTERS = {
  user: true,
  agent: true,
  summary: true,
  command: true,
  apply_patch: true,
  write_file: true,
};

export const buildEntryLines = (
  entry,
  compact,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  const kind = detectTraceType(entry);
  const deco = getDecorator(kind);
  const width = new TextLayout(terminalWidth).contentWidth;
  if (compact) {
    return [deco.headerLine(entry), deco.contentCompact(entry, width)];
  }
  return [deco.headerLine(entry), ...deco.contentFull(entry, width)];
};

export const prepareEntry = (
  entry,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  // List view: always 2 lines, compact mode
  const lines = buildEntryLines(entry, true, terminalWidth);

  // Stable height for list view (2 content lines + 1 margin)
  const height = 3;
  const traceType = detectTraceType(entry);

  return { entry, lines, height, traceType };
};
