import { formatTimestamp } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';
import { sanitizeText } from '../utils/line-formatter.js';

import { TRACE_ICONS, TRACE_COLORS } from '../constants/ui.js';

/** @type {import('./index.js').EventDecorator} */
export const applyPatch = {
  kind: 'apply_patch',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    return {
      type: 'text',
      icon: TRACE_ICONS.apply_patch,
      text: `${ts} [APPLY_PATCH exit:${exit}]`,
      color: exit === 0 ? TRACE_COLORS.apply_patch : 'red',
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const first = sanitizeText(entry.patch || '').split('\n')[0];
    return {
      type: 'text',
      text: tl.truncate(first, width),
      color: 'gray',
      dimOnModal: false,
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];

    // Wrap patch lines instead of truncating
    const patchLines = sanitizeText(entry.patch || '').split('\n');
    patchLines.forEach((line, i) => {
      if (i === 0) {
        // First line doesn't need prefix, just wrap it
        const wrappedLines = tl.wrap(line, { width });
        wrappedLines.forEach((wrappedLine) => {
          lines.push({
            type: 'text',
            text: wrappedLine,
            color: 'white',
            dimOnModal: false,
          });
        });
      } else {
        // Subsequent lines get 2-space prefix
        const wrappedLines = tl.wrap(line, { width: width - 2, prefix: '  ' });
        wrappedLines.forEach((wrappedLine) => {
          lines.push({
            type: 'text',
            text: '  ' + wrappedLine,
            color: 'white',
            dimOnModal: false,
          });
        });
      }
    });

    const output = sanitizeText(entry.result?.output || '').trim();
    if (output) {
      lines.push({
        type: 'text',
        text: tl.createSeparator(),
        color: 'gray',
        dim: true,
      });
      // Wrap output lines instead of truncating
      output.split('\n').forEach((outputLine) => {
        const wrappedOutputLines = tl.wrap(outputLine, {
          width: width - 2,
          prefix: '  ',
        });
        wrappedOutputLines.forEach((wrappedLine) => {
          lines.push({
            type: 'text',
            text: '  ' + wrappedLine,
            color: 'gray',
            dimOnModal: true,
          });
        });
      });
    }
    return lines;
  },
};
