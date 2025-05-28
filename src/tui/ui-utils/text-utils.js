import { LAYOUT } from '../constants/index.js';

export const ELLIPSIS_LENGTH = LAYOUT.ELLIPSIS_LENGTH;
export const DEFAULT_MAX_SEPARATOR_WIDTH = LAYOUT.MAX_SEPARATOR_WIDTH;
export const MIN_CONTENT_WIDTH = LAYOUT.MIN_TERMINAL_WIDTH;

export class TextLayout {
  constructor(terminalWidth) {
    this.terminalWidth = terminalWidth;
    this.contentWidth = Math.max(MIN_CONTENT_WIDTH, terminalWidth - 10);
  }

  wrap(text, options = {}) {
    const width = options.width || this.contentWidth;
    const prefix = options.prefix || '';
    if (!text || width <= 0) return [];

    const lines = [];
    const words = text.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (word.length > width) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        let lastChunk = '';
        for (let i = 0; i < word.length; i += width) {
          const chunk = word.slice(i, Math.min(i + width, word.length));
          const fullLine = (lines.length > 0 ? prefix : '') + chunk;
          lines.push(fullLine);
          lastChunk = chunk;
        }
        const lastLineLength =
          (lines.length > 0 ? prefix.length : 0) + lastChunk.length;
        if (lastLineLength < width) {
          currentLine = lines.pop();
        }
        continue;
      }
      const testLine = currentLine ? currentLine + ' ' + word : word;
      if (testLine.length > width) {
        lines.push(currentLine);
        currentLine = prefix + word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [''];
  }

  truncate(text, width = this.contentWidth) {
    const ellipsis = '.'.repeat(ELLIPSIS_LENGTH);
    if (!text) return '';
    if (width <= ELLIPSIS_LENGTH) return ellipsis;
    if (text.length < width) return text;
    return text.substring(0, Math.max(0, width - ELLIPSIS_LENGTH)) + ellipsis;
  }

  createSeparator(width = this.contentWidth) {
    const sepWidth = Math.min(width, DEFAULT_MAX_SEPARATOR_WIDTH);
    return '─'.repeat(sepWidth);
  }
}

// Regex patterns for text sanitization
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*m/g;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const CHECKMARK_EMOJI_PATTERN = /✅/g;
const CROSSMARK_EMOJI_PATTERN = /❌/g;

export const sanitizeText = (text) => {
  if (!text) return '';

  return text
    .replace(/\t/g, '  ')
    .replace(ANSI_ESCAPE_PATTERN, '')
    .replace(CONTROL_CHARS_PATTERN, ' ')
    .replace(CHECKMARK_EMOJI_PATTERN, '[✓]')
    .replace(CROSSMARK_EMOJI_PATTERN, '[✗]');
};

export const isEnterKey = (key) => !!(key && key.return);
export const isBackKey = (input, key) =>
  !!((key && key.escape) || input === 'q');
export const isExitKey = (input, key) =>
  isEnterKey(key) || isBackKey(input, key);
