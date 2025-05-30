import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout, sanitizeText } from '../ui-utils/text-utils.js';

import { TRACE_ICONS, TRACE_COLORS } from '../ui-utils/constants.js';

/** @type {import('./index.js').EventDecorator} */
export const writeFile = {
  kind: 'write_file',

  headerLine(entry) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    const duration = entry.result?.duration || 'N/A';
    const inLines = (entry.content || '').split('\n').filter(Boolean).length;
    const outLines = (entry.result?.output || '')
      .split('\n')
      .filter(Boolean).length;
    return {
      type: 'text',
      icon: TRACE_ICONS.write_file,
      text: `${ts} [WRITE_FILE exit:${exit} dur:${duration} in:${inLines} out:${outLines}]`,
      color: exit === 0 ? TRACE_COLORS.write_file : 'red',
      bold: true,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const pathLine = entry.path || '';
    return {
      type: 'text',
      text: tl.truncate(pathLine, width),
      color: 'gray',
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
        color: 'white',
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
