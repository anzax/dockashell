import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout, sanitizeText } from '../ui-utils/text-utils.js';
import { TRACE_ICONS, TRACE_COLORS } from '../ui-utils/constants.js';

/**
 * Factory for shell related decorators like command, apply_patch and write_file.
 * @param {Object} config
 * @param {string} config.kind
 * @param {string} config.label
 * @param {string} config.icon
 * @param {string} config.color
 * @param {(entry: any) => number} config.inputLineCount
 * @param {(entry: any, width: number, tl: TextLayout) => import('./index.js').RenderLine} config.compactLine
 * @param {(entry: any, width: number, tl: TextLayout) => import('./index.js').RenderLine[]} config.fullInputLines
 * @returns {import('./index.js').EventDecorator}
 */
function createShellDecorator({
  kind,
  label,
  icon,
  color,
  inputLineCount,
  compactLine,
  fullInputLines,
}) {
  return {
    kind,

    headerLine(entry) {
      const ts = formatTimestamp(entry.timestamp);
      const exit = entry.result?.exitCode ?? 'N/A';
      const duration = entry.result?.duration || 'N/A';
      const inLines = inputLineCount(entry);
      const outLines = (entry.result?.output || '')
        .split('\n')
        .filter(Boolean).length;
      return {
        type: 'text',
        icon,
        text: `${ts} [${label} exit:${exit} dur:${duration}] [↑:${inLines} ↓:${outLines} lines]`,
        color: exit === 0 ? color : TRACE_COLORS.error,
        bold: true,
      };
    },

    contentCompact(entry, width) {
      const tl = new TextLayout(width);
      return compactLine(entry, width, tl);
    },

    contentFull(entry, width) {
      const tl = new TextLayout(width);
      const lines = fullInputLines(entry, width, tl);
      const output = sanitizeText(entry.result?.output || '').trim();
      if (output) {
        lines.push({
          type: 'text',
          text: tl.createSeparator(),
          color: 'gray',
          dim: true,
        });
        output.split('\n').forEach((line) => {
          tl.wrap(line, { width: width - 2, prefix: '  ' }).forEach(
            (wrapped) => {
              lines.push({
                type: 'text',
                text: '  ' + wrapped,
                color: 'gray',
                dimOnModal: true,
              });
            }
          );
        });
      }
      return lines;
    },
  };
}

function sanitizePatch(patch) {
  let lines = sanitizeText(patch || '').split('\n');
  if (lines[0] === '*** Begin Patch') lines = lines.slice(1);
  if (lines[lines.length - 1] === '*** End Patch') lines = lines.slice(0, -1);
  return lines;
}

export const command = createShellDecorator({
  kind: 'command',
  label: 'COMMAND',
  icon: TRACE_ICONS.command,
  color: TRACE_COLORS.command,
  inputLineCount: (e) => (e.command || '').split('\n').filter(Boolean).length,
  compactLine(entry, width, tl) {
    const first = sanitizeText(entry.command || '').split('\n')[0];
    return {
      type: 'text',
      text: `$ ${tl.truncate(first, width - 3)}`,
      color: 'gray',
      dimOnModal: false,
    };
  },
  fullInputLines(entry, width, tl) {
    const lines = [];
    sanitizeText(entry.command || '')
      .split('\n')
      .forEach((line, i) => {
        const prefix = i === 0 ? '$ ' : '  ';
        tl.wrap(line, { width: width - prefix.length, prefix: '  ' }).forEach(
          (w, j) => {
            lines.push({
              type: 'text',
              text: (i === 0 && j === 0 ? '$ ' : '  ') + w,
              color: 'white',
              dimOnModal: false,
            });
          }
        );
      });
    return lines;
  },
});

export const applyPatch = createShellDecorator({
  kind: 'apply_patch',
  label: 'APPLY_PATCH',
  icon: TRACE_ICONS.apply_patch,
  color: TRACE_COLORS.apply_patch,
  inputLineCount: (e) => sanitizePatch(e.patch).length,
  compactLine(entry, width, tl) {
    const first = sanitizePatch(entry.patch)[0] || '';
    return {
      type: 'text',
      text: tl.truncate(first, width),
      color: 'gray',
      dimOnModal: false,
    };
  },
  fullInputLines(entry, width, tl) {
    const lines = [];
    sanitizePatch(entry.patch).forEach((line, i) => {
      const opts = i === 0 ? { width } : { width: width - 2, prefix: '  ' };
      tl.wrap(line, opts).forEach((w) => {
        lines.push({
          type: 'text',
          text: (i === 0 ? '' : '  ') + w,
          color: 'white',
          dimOnModal: false,
        });
      });
    });
    return lines;
  },
});

export const writeFile = createShellDecorator({
  kind: 'write_file',
  label: 'WRITE_FILE',
  icon: TRACE_ICONS.write_file,
  color: TRACE_COLORS.write_file,
  inputLineCount: (e) => (e.content || '').split('\n').filter(Boolean).length,
  compactLine(entry, width, tl) {
    const pathLine = entry.path || '';
    return {
      type: 'text',
      text: tl.truncate(pathLine, width),
      color: 'gray',
      dimOnModal: false,
    };
  },
  fullInputLines(entry, width, tl) {
    const lines = [];
    tl.wrap(entry.path || '', { width }).forEach((p) => {
      lines.push({ type: 'text', text: p, color: 'white', dimOnModal: false });
    });
    const content = sanitizeText(entry.content || '').trim();
    if (content) {
      lines.push({
        type: 'text',
        text: tl.createSeparator(),
        color: 'gray',
        dim: true,
      });
      content.split('\n').forEach((line) => {
        tl.wrap(line, { width }).forEach((w) => {
          lines.push({
            type: 'text',
            text: w,
            color: 'gray',
            dimOnModal: true,
          });
        });
      });
    }
    return lines;
  },
});

export { createShellDecorator };
