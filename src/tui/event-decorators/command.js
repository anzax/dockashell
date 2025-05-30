import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout, sanitizeText } from '../ui-utils/text-utils.js';

import { TRACE_ICONS } from '../ui-utils/constants.js';

/** @type {import('./index.js').EventDecorator} */
export const command = {
  kind: 'command',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    const duration = entry.result?.duration || 'N/A';
    const inLines = (entry.command || '').split('\n').filter(Boolean).length;
    const outLines = (entry.result?.output || '')
      .split('\n')
      .filter(Boolean).length;
    return {
      type: 'text',
      icon: TRACE_ICONS.command,
      text: `${ts} [COMMAND exit:${exit} dur:${duration} in:${inLines} out:${outLines}]`,
      color: exit === 0 ? 'white' : 'red',
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const cmd = sanitizeText(entry.command || '').split('\n')[0];
    return {
      type: 'text',
      text: `$ ${tl.truncate(cmd, width - 3)}`,
      color: 'gray',
      dimOnModal: false,
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];

    // Wrap command lines instead of truncating
    const commandLines = sanitizeText(entry.command || '').split('\n');
    commandLines.forEach((line, i) => {
      const prefix = i === 0 ? '$ ' : '  ';
      const wrappedLines = tl.wrap(line, {
        width: width - prefix.length,
        prefix: '  ',
      });

      wrappedLines.forEach((wrappedLine, j) => {
        lines.push({
          type: 'text',
          text: (i === 0 && j === 0 ? '$ ' : '  ') + wrappedLine,
          color: 'white',
          dimOnModal: false,
        });
      });
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
