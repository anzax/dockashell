import {} from './line-formatter.js';
import { getDecorator } from '../event-decorators/index.js';
import { TextLayout } from './text-layout.js';
import { TRACE_ICONS, TRACE_COLORS, TRACE_TYPES } from '../constants/ui.js';
import { LAYOUT } from '../constants/layout.js';

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
export const formatLines = (text, maxLines = Infinity) => {
  if (!text) return [];
  const lines = text.split('\n');
  return [
    ...lines.slice(0, maxLines),
    ...(lines.length > maxLines ? ['...'] : []),
  ];
};

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

/**
 * Find the entry with the closest timestamp to the target
 * @param {Array} entries - Array of prepared entries
 * @param {string|null} targetTimestamp - Target timestamp to match
 * @returns {number} Index of closest entry, or -1 if no entries
 */
export const findClosestTimestamp = (entries, targetTimestamp) => {
  if (!entries || entries.length === 0) return -1;
  if (!targetTimestamp) return -1;

  const target = new Date(targetTimestamp).getTime();
  if (isNaN(target)) return -1;

  let closestIndex = 0;
  let closestDiff = Math.abs(
    new Date(entries[0].entry.timestamp).getTime() - target
  );

  for (let i = 1; i < entries.length; i++) {
    const entryTime = new Date(entries[i].entry.timestamp).getTime();
    if (isNaN(entryTime)) continue;

    const diff = Math.abs(entryTime - target);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

export const getTraceIcon = (type) => TRACE_ICONS[type] || TRACE_ICONS.unknown;

export const getTraceColor = (type, exitCode) => {
  if (['command', 'apply_patch', 'write_file'].includes(type)) {
    return exitCode !== undefined && exitCode !== 0
      ? 'red'
      : TRACE_COLORS[type] || 'white';
  }
  if (TRACE_COLORS[type]) return TRACE_COLORS[type];
  return type === 'unknown' ? 'gray' : 'white';
};

// Backwards compatibility helpers for note types
export const getNoteTypeColor = (noteType) => getTraceColor(noteType);
export const getNoteTypeIcon = (noteType) => getTraceIcon(noteType);

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
  maxLines,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  // List view: always 2 lines, compact mode
  const lines = buildEntryLines(entry, true, terminalWidth);

  // Stable height for list view (2 content lines + 1 margin)
  const height = 3;
  const traceType = detectTraceType(entry);

  return { entry, lines, height, traceType };
};
