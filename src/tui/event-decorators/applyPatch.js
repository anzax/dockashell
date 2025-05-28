import { formatTimestamp } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';
import { sanitizeText } from '../utils/line-formatter.js';

const ICON = '🩹';

/** @type {import('./index.js').EventDecorator} */
export const applyPatch = {
  kind: 'apply_patch',

  headerLine(entry, width) {
    const ts = formatTimestamp(entry.timestamp);
    const exit = entry.result?.exitCode ?? 'N/A';
    return {
      type: 'header',
      icon: ICON,
      text: `${ts} [APPLY_PATCH exit:${exit}]`,
      color: exit === 0 ? 'white' : 'red',
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const first = sanitizeText(entry.patch || '').split('\n')[0];
    return {
      type: 'command',
      text: tl.truncate(first, width),
      color: 'cyan',
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const lines = [];
    sanitizeText(entry.patch || '')
      .split('\n')
      .forEach((line, i) => {
        lines.push({
          type: 'command',
          text: i === 0 ? line : '  ' + tl.truncate(line, width - 2),
        });
      });
    const output = sanitizeText(entry.result?.output || '').trim();
    if (output) {
      lines.push({ type: 'separator', text: tl.createSeparator() });
      output.split('\n').forEach((o) => {
        lines.push({ type: 'output', text: tl.truncate(o, width) });
      });
    }
    return lines;
  },
};
