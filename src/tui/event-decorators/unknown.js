import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout } from '../ui-utils/text-utils.js';

import { TRACE_ICONS } from '../ui-utils/constants.js';

/** @type {import('./index.js').EventDecorator} */
export const unknown = {
  kind: 'unknown',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    const type = entry.type || entry.kind || 'unknown';
    return {
      type: 'text',
      icon: TRACE_ICONS.unknown,
      text: `${ts} [${type.toUpperCase()}]`,
      color: 'gray',
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const text = JSON.stringify(entry).split('\n')[0];
    return {
      type: 'text',
      text: tl.truncate(text, width),
      color: 'gray',
      dimOnModal: false,
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];

    // Wrap JSON lines instead of truncating
    JSON.stringify(entry, null, 2)
      .split('\n')
      .forEach((line) => {
        const wrappedLines = tl.wrap(line, { width });
        wrappedLines.forEach((wrappedLine) => {
          lines.push({
            type: 'text',
            text: wrappedLine,
            color: 'white',
            dimOnModal: false,
          });
        });
      });

    return lines;
  },
};
