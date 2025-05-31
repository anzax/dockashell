import { LAYOUT } from './constants.js';

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
    const tokens = text.match(/(\s+|\S+)/g) || [];
    let currentLine = '';

    for (let token of tokens) {
      while (token.length > width) {
        const spaceLeft = width - currentLine.length;
        if (spaceLeft === 0) {
          lines.push(currentLine.trimEnd());
          currentLine = prefix;
        }
        currentLine += token.slice(0, spaceLeft);
        token = token.slice(spaceLeft);
        if (currentLine.length === width) {
          lines.push(currentLine.trimEnd());
          currentLine = prefix;
        }
      }

      if (currentLine.length + token.length > width && currentLine) {
        lines.push(currentLine.trimEnd());
        currentLine = prefix + token;
      } else {
        currentLine += token;
      }
    }

    if (currentLine) {
      lines.push(currentLine.trimEnd());
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
  !!((key && key.escape) || input === 'b');
export const isExitKey = (input, key) =>
  isEnterKey(key) || isBackKey(input, key);
