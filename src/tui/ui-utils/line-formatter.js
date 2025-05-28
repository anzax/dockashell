/**
 * Line formatting utilities for consistent text rendering
 */

// This module currently only provides text sanitization helpers used by the TUI

// Regex patterns for text sanitization
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*m/g;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const CHECKMARK_EMOJI_PATTERN = /✅/g;
const CROSSMARK_EMOJI_PATTERN = /❌/g;

/**
 * Sanitize text to prevent terminal rendering issues
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text safe for terminal display
 */
export const sanitizeText = (text) => {
  if (!text) return '';

  return (
    text
      // Replace tabs with 2 spaces for consistent display
      .replace(/\t/g, '  ')
      // Remove ANSI escape sequences
      .replace(ANSI_ESCAPE_PATTERN, '')
      // Replace other control characters (except newline) with spaces
      .replace(CONTROL_CHARS_PATTERN, ' ')
      // Replace problematic emojis that cause terminal rendering issues
      .replace(CHECKMARK_EMOJI_PATTERN, '[✓]') // Checkmark emoji -> bracketed check
      .replace(CROSSMARK_EMOJI_PATTERN, '[✗]')
  ); // Cross mark emoji -> bracketed X
};
