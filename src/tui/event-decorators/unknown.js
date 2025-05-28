import { formatTimestamp } from '../utils/entry-utils.js';
import { TextLayout } from '../utils/text-layout.js';

const ICON = '❓';

/** @type {import('./index.js').EventDecorator} */
export const unknown = {
  kind: 'unknown',

  headerLine(entry, width) {
    const ts = formatTimestamp(entry.timestamp);
    const type = entry.type || entry.kind || 'unknown';
    return { type: 'header', icon: ICON, text: `${ts} [${type.toUpperCase()}]`, color: 'gray' };
  },

  contentCompact(entry, width) {
    const tl = new TextLayout(width);
    const text = JSON.stringify(entry).split('\n')[0];
    return { type: 'content', text: tl.truncate(text, width), color: 'gray' };
  },

  contentFull(entry, width) {
    const tl = new TextLayout(width);
    return JSON.stringify(entry, null, 2)
      .split('\n')
      .map((line) => ({ type: 'content', text: tl.truncate(line, width), color: 'gray' }));
  },
};
