import { formatTimestamp } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';
import { sanitizeText } from '../utils/line-formatter.js';

import { TRACE_ICONS } from '../constants/ui.js';

/** @type {import('./index.js').EventDecorator} */
export const writeFile = {
  kind: 'write_file',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    return {
      type: 'text',
      icon: TRACE_ICONS.write_file,
      text: `${ts} [WRITE_FILE exit:${exit}]`,
      color: exit === 0 ? 'white' : 'red',
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const pathLine = entry.path || '';
    return {
      type: 'text',
      text: tl.truncate(pathLine, width),
      color: 'magenta',
      dimOnModal: false,
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];

    // Wrap file path instead of truncating
    const pathLines = tl.wrap(entry.path || '', { width });
    pathLines.forEach((pathLine) => {
      lines.push({
        type: 'text',
        text: pathLine,
        color: 'magenta',
        dimOnModal: false,
      });
    });

    const content = sanitizeText(entry.content || '').trim();
    if (content) {
      lines.push({
        type: 'text',
        text: tl.createSeparator(),
        color: 'gray',
        dim: true,
      });
      // Wrap content lines instead of truncating
      content.split('\n').forEach((contentLine) => {
        const wrappedContentLines = tl.wrap(contentLine, { width });
        wrappedContentLines.forEach((wrappedLine) => {
          lines.push({
            type: 'text',
            text: wrappedLine,
            color: 'gray',
            dimOnModal: true,
          });
        });
      });
    }
    return lines;
  },
};
