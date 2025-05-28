import { formatTimestamp } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';
import { sanitizeText } from '../utils/line-formatter.js';

const ICON = '📄';

/** @type {import('./index.js').EventDecorator} */
export const writeFile = {
  kind: 'write_file',

  headerLine(entry, width) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    return {
      type: 'header',
      icon: ICON,
      text: `${ts} [WRITE_FILE exit:${exit}]`,
      color: exit === 0 ? 'white' : 'red',
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const pathLine = entry.path || '';
    return {
      type: 'command',
      text: tl.truncate(pathLine, width),
      color: 'magenta',
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];
    lines.push({
      type: 'command',
      text: tl.truncate(entry.path || '', width),
    });
    const content = sanitizeText(entry.content || '').trim();
    if (content) {
      lines.push({ type: 'separator', text: tl.createSeparator() });
      content.split('\n').forEach((line) => {
        lines.push({ type: 'command', text: tl.truncate(line, width) });
      });
    }
    return lines;
  },
};
