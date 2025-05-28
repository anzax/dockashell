import { formatTimestamp } from '../ui-utils/entry-utils.js';
import { TextLayout, sanitizeText } from '../ui-utils/text-utils.js';
import { TRACE_ICONS, TRACE_COLORS } from '../constants/index.js';

/**
 * Factory function to create note decorators with different configurations
 * @param {Object} config
 * @param {string} config.kind - The trace type (user, agent, summary)
 * @param {string} config.label - The header label ([USER], [AGENT], [SUMMARY])
 * @param {string} config.icon - The icon from TRACE_ICONS
 * @param {string} config.color - The color from TRACE_COLORS
 * @returns {import('./index.js').EventDecorator}
 */
function createNoteDecorator({ kind, label, icon, color }) {
  return {
    kind,

    headerLine(entry) {
      const ts = formatTimestamp(entry.timestamp);
      return {
        type: 'text',
        icon,
        text: `${ts} [${label}]`,
        color,
        bold: true,
      };
    },

    contentCompact(entry, width) {
      const tl = new TextLayout(width);
      const text = sanitizeText(entry.text || '').split('\n')[0];
      return {
        type: 'text',
        text: tl.truncate(text, width),
        color: 'gray',
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
              color: 'white',
            });
          });
        });

      return lines;
    },
  };
}

// Export specific note decorators
export const user = createNoteDecorator({
  kind: 'user',
  label: 'USER',
  icon: TRACE_ICONS.user,
  color: TRACE_COLORS.user,
});

export const agent = createNoteDecorator({
  kind: 'agent',
  label: 'AGENT',
  icon: TRACE_ICONS.agent,
  color: TRACE_COLORS.agent,
});

export const summary = createNoteDecorator({
  kind: 'summary',
  label: 'SUMMARY',
  icon: TRACE_ICONS.summary,
  color: TRACE_COLORS.summary,
});
