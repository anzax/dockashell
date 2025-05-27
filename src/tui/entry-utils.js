import {
  formatMultilineText,
  truncateText,
  formatCommandOutput,
} from './line-formatter.js';

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
export const detectTraceType = (entry) => {
  if (!entry) return 'unknown';
  if (entry.kind === 'command' || entry.command) return 'command';
  if (entry.kind === 'apply_patch' || entry.patch) return 'apply_patch';
  if (entry.kind === 'write_file') return 'write_file';
  if (entry.kind === 'note') return entry.noteType || 'note';
  if (entry.noteType) return entry.noteType;
  if (entry.type) return entry.type; // legacy notes
  return 'unknown';
};

// Icon mapping for all supported trace types
export const TRACE_ICONS = {
  command: '💻',
  apply_patch: '🩹',
  write_file: '📄',
  user: '👤',
  agent: '🤖',
  summary: '📝',
  note: '📋',
  unknown: '❓',
};

// Color mapping for note types
export const NOTE_COLORS = {
  user: 'blue',
  agent: 'yellow',
  summary: 'magenta',
  note: 'white',
};

export const getTraceIcon = (type) => TRACE_ICONS[type] || TRACE_ICONS.unknown;

export const getTraceColor = (type, exitCode) => {
  if (['command', 'apply_patch', 'write_file'].includes(type)) {
    return exitCode === 0 ? 'green' : 'red';
  }
  if (NOTE_COLORS[type]) return NOTE_COLORS[type];
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
export const appendOutputLines = (lines, output, contentWidth, maxLines) => {
  if (!output || !output.trim()) return;
  lines.push({
    type: 'separator',
    text: '─'.repeat(Math.min(contentWidth, 60)),
  });

  const outputLines = formatCommandOutput(
    output.trim(),
    contentWidth,
    maxLines - lines.length
  );
  outputLines.forEach((line) => lines.push({ type: 'output', text: line }));
};

export const buildEntryLines = (
  entry,
  maxLines = Infinity,
  terminalWidth = 80,
  options = {}
) => {
  const { showOutput = true, compact = false, _isDetailView = false } = options;
  const lines = [];

  // Calculate available width for content
  const contentAvailableWidth = Math.max(40, terminalWidth - 10); // Leave some margin

  // Always use 2 lines for list view (compact mode)
  const _effectiveMaxLines = compact ? 2 : maxLines;

  const traceType = detectTraceType(entry);

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
          });
        } else {
          const formattedLines = formatMultilineText(
            text,
            contentAvailableWidth,
            _effectiveMaxLines - 1
          );
          formattedLines.forEach((line) =>
            lines.push({ type: 'content', text: line })
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
        lines.push({ type: 'command', text: `$ ${truncated}` });
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
              });
            });
          } else {
            lines.push({ type: 'command', text: `$ ${command}` });
          }
        } else {
          commandLines.forEach((line, index) => {
            lines.push({
              type: 'command',
              text: index === 0 ? `$ ${line}` : `  ${line}`,
            });
          });
        }
        if (showOutput) {
          appendOutputLines(
            lines,
            result.output,
            contentAvailableWidth,
            maxLines
          );
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
          });
        });
        if (showOutput) {
          appendOutputLines(
            lines,
            result.output,
            contentAvailableWidth,
            maxLines
          );
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
      });

      const content = entry.content || '';
      if (content && !compact) {
        lines.push({
          type: 'separator',
          text: '─'.repeat(Math.min(contentAvailableWidth, 60)),
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
        });
      }

      if (showOutput) {
        appendOutputLines(
          lines,
          result.output,
          contentAvailableWidth,
          maxLines
        );
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
        });
      } else {
        const jsonLines = formatMultilineText(
          json,
          contentAvailableWidth,
          maxLines - 1
        );
        jsonLines.forEach((line) =>
          lines.push({ type: 'content', text: line })
        );
      }
    }
  }

  return lines;
};

export const prepareEntry = (entry, maxLines, terminalWidth = 80) => {
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

  // Height is always 3 for list view (2 lines + 1 margin)
  const height = 3;
  const traceType = detectTraceType(entry);

  return { entry, lines, fullLines, height, traceType };
};
