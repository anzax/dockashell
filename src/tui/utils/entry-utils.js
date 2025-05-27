import {
  formatMultilineText,
  truncateText,
  formatCommandOutput,
} from './line-formatter.js';
import { TextLayout } from './text-layout.js';
import { TRACE_ICONS, TRACE_COLORS, TRACE_TYPES } from '../../constants/ui.js';
import { LAYOUT } from '../../constants/layout.js';

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
  if (entry.kind === 'note') return entry.noteType || TRACE_TYPES.NOTE;
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

// Helper to build a standard header line
export const createHeaderLine = (entry, traceType, typeText) => ({
  type: 'header',
  icon: getTraceIcon(traceType),
  timestamp: formatTimestamp(entry.timestamp),
  typeText,
  typeColor: getTraceColor(traceType, entry.result?.exitCode),
});

// Helper to append formatted output lines if present
export const appendOutputLines = (lines, output, layout, maxLines) => {
  if (!output || !output.trim()) return;
  lines.push({
    type: 'separator',
    text: layout.createSeparator(),
  });

  const outputLines = formatCommandOutput(
    output.trim(),
    layout.contentWidth,
    maxLines - lines.length
  );
  outputLines.forEach((line) => lines.push({ type: 'output', text: line }));
};

export const buildEntryLines = (
  entry,
  maxLines = Infinity,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH,
  options = {}
) => {
  const { showOutput = true, compact = false, _isDetailView = false } = options;
  const lines = [];

  // Calculate available width for content
  const layout = new TextLayout(terminalWidth);
  const contentAvailableWidth = layout.contentWidth; // Leave some margin

  // Always use 2 lines for list view (compact mode)
  const _effectiveMaxLines = compact ? 2 : maxLines;

  const traceType = detectTraceType(entry);
  const traceColor = getTraceColor(traceType, entry.result?.exitCode);

  switch (traceType) {
    case 'user':
    case 'agent':
    case 'summary':
    case 'note': {
      lines.push(createHeaderLine(entry, traceType, traceType.toUpperCase()));
      if (entry.text) {
        const text = entry.text.trim();
        if (compact) {
          const firstLine = text.split('\n')[0];
          lines.push({
            type: 'content',
            text: truncateText(firstLine, contentAvailableWidth),
            color: traceColor,
          });
        } else {
          const formattedLines = formatMultilineText(
            text,
            contentAvailableWidth,
            _effectiveMaxLines - 1
          );
          formattedLines.forEach((line) =>
            lines.push({ type: 'content', text: line, color: traceColor })
          );
        }
      }
      break;
    }
    case 'command': {
      const result = entry.result || {};
      const exitCode = result.exitCode !== undefined ? result.exitCode : 'N/A';
      const duration = result.duration || 'N/A';
      lines.push(
        createHeaderLine(
          entry,
          traceType,
          `COMMAND | Exit: ${exitCode} | ${duration}`
        )
      );

      const command = entry.command || '';
      if (compact) {
        let displayCommand = command;
        if (command.includes('\n')) {
          const firstLine = command.split('\n')[0];
          const lineCount = command.split('\n').length;
          displayCommand = `${firstLine} ... (${lineCount} lines)`;
        }
        const prefixWidth = 2;
        const truncated = truncateText(
          displayCommand,
          contentAvailableWidth - prefixWidth
        );
        lines.push({
          type: 'command',
          text: `$ ${truncated}`,
          color: traceColor,
        });
      } else {
        const commandLines = command.split('\n');
        if (commandLines.length === 1) {
          if (command.length > contentAvailableWidth - 2) {
            const wrapped = formatMultilineText(
              command,
              contentAvailableWidth - 2,
              Infinity,
              false
            );
            wrapped.forEach((line, index) => {
              lines.push({
                type: 'command',
                text: index === 0 ? `$ ${line}` : `  ${line}`,
                color: traceColor,
              });
            });
          } else {
            lines.push({
              type: 'command',
              text: `$ ${command}`,
              color: traceColor,
            });
          }
        } else {
          commandLines.forEach((line, index) => {
            lines.push({
              type: 'command',
              text: index === 0 ? `$ ${line}` : `  ${line}`,
              color: traceColor,
            });
          });
        }
        if (showOutput) {
          appendOutputLines(lines, result.output, layout, maxLines);
        }
      }
      break;
    }
    case 'apply_patch': {
      const result = entry.result || {};
      const exitCode = result.exitCode !== undefined ? result.exitCode : 'N/A';
      const duration = result.duration || 'N/A';
      lines.push(
        createHeaderLine(
          entry,
          traceType,
          `APPLY_PATCH | Exit: ${exitCode} | ${duration}`
        )
      );
      const patch = entry.patch || '';
      if (compact) {
        const patchLines = patch.split('\n');
        const first = patchLines[0];
        const display =
          patchLines.length > 1
            ? `${first} ... (${patchLines.length} lines)`
            : first;
        lines.push({
          type: 'command',
          text: truncateText(display, contentAvailableWidth),
          color: traceColor,
        });
      } else {
        const patchLines = formatMultilineText(
          patch,
          contentAvailableWidth - 2,
          Infinity,
          true
        );
        patchLines.forEach((line, index) => {
          lines.push({
            type: 'command',
            text: index === 0 ? line : `  ${line}`,
            color: traceColor,
          });
        });
        if (showOutput) {
          appendOutputLines(lines, result.output, layout, maxLines);
        }
      }
      break;
    }
    case 'write_file': {
      const result = entry.result || {};
      const exitCode = result.exitCode !== undefined ? result.exitCode : 'N/A';
      const duration = result.duration || 'N/A';
      lines.push(
        createHeaderLine(
          entry,
          traceType,
          `WRITE_FILE | Exit: ${exitCode} | ${duration}`
        )
      );

      const pathText = entry.path || '';
      const overwriteText = entry.overwrite ? ' (overwrite)' : '';
      const sizeText =
        entry.contentLength !== undefined
          ? ` [${entry.contentLength} bytes]`
          : '';
      const pathLine = `${pathText}${overwriteText}${sizeText}`;

      lines.push({
        type: 'command',
        text: truncateText(pathLine, contentAvailableWidth),
        color: traceColor,
      });

      const content = entry.content || '';
      if (content && !compact) {
        lines.push({
          type: 'separator',
          text: layout.createSeparator(),
        });
        const contentLines = formatMultilineText(
          content,
          contentAvailableWidth - 2,
          20,
          true
        );
        contentLines.forEach((line, index) => {
          lines.push({
            type: 'command',
            text: index === 0 ? line : `  ${line}`,
            color: traceColor,
          });
        });
      } else if (content && compact) {
        const contentLines = content.split('\n');
        const firstLine = contentLines[0] || '';
        const display =
          contentLines.length > 1
            ? `${firstLine} ... (${contentLines.length} lines)`
            : firstLine;
        lines.push({
          type: 'command',
          text: `  ${truncateText(display, contentAvailableWidth - 2)}`,
          color: traceColor,
        });
      }

      if (showOutput) {
        appendOutputLines(lines, result.output, layout, maxLines);
      }
      break;
    }
    default: {
      const type = entry.type || entry.kind || 'UNKNOWN';
      lines.push(createHeaderLine(entry, 'unknown', type.toUpperCase()));
      const json = JSON.stringify(entry, null, 2);
      if (compact) {
        const firstLine = json.split('\n')[0];
        lines.push({
          type: 'content',
          text: truncateText(firstLine, contentAvailableWidth),
          color: traceColor,
        });
      } else {
        const jsonLines = formatMultilineText(
          json,
          contentAvailableWidth,
          maxLines - 1
        );
        jsonLines.forEach((line) =>
          lines.push({ type: 'content', text: line, color: traceColor })
        );
      }
    }
  }

  return lines;
};

export const prepareEntry = (
  entry,
  maxLines,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  // List view: always 2 lines, compact mode
  const lines = buildEntryLines(entry, 2, terminalWidth, {
    showOutput: false,
    compact: true,
  });

  // Detail view: full content with output
  const fullLines = buildEntryLines(entry, Infinity, terminalWidth, {
    showOutput: true,
    compact: false,
    isDetailView: true,
  });

  // Stable height for list view (2 content lines + 1 margin)
  const height = 3;
  const traceType = detectTraceType(entry);

  return { entry, lines, fullLines, height, traceType };
};
