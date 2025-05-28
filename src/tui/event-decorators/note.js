import { formatTimestamp, getTraceColor, getTraceIcon } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';
import { sanitizeText } from '../utils/line-formatter.js';

/** @type {import('./index.js').EventDecorator} */
export const note = {
  kind: 'note',

  headerLine(entry, width) {
    const ts = formatTimestamp(entry.timestamp);
    const nt = entry.noteType || entry.type || 'note';
    const color = getTraceColor(nt);
    const icon = getTraceIcon(nt);
    return {
      type: 'header',
      icon,
      text: `${ts} [${nt.toUpperCase()}]`,
      color,
    };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const text = sanitizeText(entry.text || '').split('\n')[0];
    return {
      type: 'content',
      text: tl.truncate(text, width),
      color: getTraceColor(entry.noteType || 'note'),
    };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    const color = getTraceColor(entry.noteType || 'note');
    const lines = [];
    sanitizeText(entry.text || '')
      .split('\n')
      .forEach((line) => {
        lines.push({ type: 'content', text: tl.truncate(line, width), color });
      });
    return lines;
  },
};
