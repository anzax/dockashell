import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout, sanitizeText } from '../ui-utils/text-utils.js';

import { TRACE_ICONS, TRACE_COLORS } from '../ui-utils/constants.js';

/** @type {import('./index.js').EventDecorator} */
export const applyPatch = {
  kind: 'apply_patch',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    const duration = entry.result?.duration || 'N/A';
    let patchLines = (entry.patch || '').split('\n').filter(Boolean);
    if (patchLines[0] === '*** Begin Patch') patchLines = patchLines.slice(1);
    if (patchLines[patchLines.length - 1] === '*** End Patch') {
      patchLines = patchLines.slice(0, -1);
    }
    const inLines = patchLines.length;
    const outLines = (entry.result?.output || '')
      .split('\n')
      .filter(Boolean).length;
    return {
      type: 'text',
      icon: TRACE_ICONS.apply_patch,
      text: `${ts} [APPLY_PATCH exit:${exit} dur:${duration} in:${inLines} out:${outLines}]`,
      color: exit === 0 ? TRACE_COLORS.apply_patch : 'red',
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    let lines = sanitizeText(entry.patch || '').split('\n');
    if (lines[0] === '*** Begin Patch') lines = lines.slice(1);
    if (lines[lines.length - 1] === '*** End Patch') {
      lines = lines.slice(0, -1);
    }
    const first = lines[0] || '';
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
    let patchLines = sanitizeText(entry.patch || '').split('\n');
    if (patchLines[0] === '*** Begin Patch') patchLines = patchLines.slice(1);
    if (patchLines[patchLines.length - 1] === '*** End Patch') {
      patchLines = patchLines.slice(0, -1);
    }
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
