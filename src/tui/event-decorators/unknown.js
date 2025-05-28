import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout } from '../ui-utils/text-utils.js';

import { TRACE_ICONS } from '../ui-utils/constants.js';

/** @type {import('./index.js').EventDecorator} */
export const unknown = {
  kind: 'unknown',

  headerLine(entry) {
    // Handle cases where entry might be undefined or null
    if (!entry) {
      return {
        type: 'text',
        icon: TRACE_ICONS.unknown,
        text: 'No timestamp [UNKNOWN]',
        color: 'gray',
        bold: true,
      };
    }
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
    if (!entry) {
      return {
        type: 'text',
        text: 'No entry data',
        color: 'gray',
        dimOnModal: false,
      };
    }
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
    if (!entry) {
      return [
        {
          type: 'text',
          text: 'No entry data',
          color: 'white',
          dimOnModal: false,
        },
      ];
    }
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
