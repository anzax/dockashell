import { formatTimestamp } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';
import { sanitizeText } from '../utils/line-formatter.js';
import { TRACE_ICONS, TRACE_COLORS } from '../constants/ui.js';

/** @type {import('./index.js').EventDecorator} */
export const user = {
  kind: 'user',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    return {
      type: 'text',
      icon: TRACE_ICONS.user,
      text: `${ts} [USER]`,
      color: TRACE_COLORS.user,
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const text = sanitizeText(entry.text || '').split('\n')[0];
    return {
      type: 'text',
      text: tl.truncate(text, width),
      color: TRACE_COLORS.user,
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];

    // Wrap text lines instead of truncating
    sanitizeText(entry.text || '')
      .split('\n')
      .forEach((line) => {
        const wrappedLines = tl.wrap(line, { width });
        wrappedLines.forEach((wrappedLine) => {
          lines.push({
            type: 'text',
            text: wrappedLine,
            color: TRACE_COLORS.user,
          });
        });
      });

    return lines;
  },
};
