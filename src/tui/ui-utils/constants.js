export const LAYOUT = {
  /** Height reserved for modal headers */
  HEADER_HEIGHT: 4,
  /** Margin used for borders in modal layouts */
  BORDER_MARGIN: 2,
  /** Number of characters used for ellipsis when truncating */
  ELLIPSIS_LENGTH: 3,
  /** Maximum width for separator lines */
  MAX_SEPARATOR_WIDTH: 60,
  /** Minimum width expected for terminal content */
  MIN_TERMINAL_WIDTH: 40,
  /** Fallback terminal height when detection fails */
  DEFAULT_TERMINAL_HEIGHT: 24,
  /** Fallback terminal width when detection fails */
  DEFAULT_TERMINAL_WIDTH: 80,
};

export const SHORTCUTS = /** @type {const} */ ({
  NAVIGATE: '[↑↓] Navigate',
  LINE: '[↑↓] Line',
  SCROLL: '[↑↓] Scroll',
  PAGE: '[PgUp/PgDn] Page',
  TOP_BOTTOM: '[g/G] Top/Bottom',
  DETAIL: '[Enter] Detail',
  OPEN: '[Enter] Open',
  APPLY: '[Enter] Apply',
  TOGGLE: '[Space] Toggle',
  REFRESH: '[r] Refresh',
  FILTER: '[f] Filter',
  BACK_B: '[b] Back',
  PREV_NEXT: '[←/→] Prev/Next',
  EXIT: '[Enter/Esc/b] Back',
  QUIT: '[q] Quit',
});

export const buildFooter = (...items) => items.filter(Boolean).join('  ');

export const TRACE_TYPES = /** @type {const} */ ({
  COMMAND: 'command',
  APPLY_PATCH: 'apply_patch',
  WRITE_FILE: 'write_file',
  USER: 'user',
  AGENT: 'agent',
  SUMMARY: 'summary',
  NOTE: 'note',
  UNKNOWN: 'unknown',
});

export const TRACE_ICONS = /** @type {const} */ ({
  command: '💻',
  apply_patch: '🩹',
  write_file: '📄',
  user: '👤',
  agent: '🤖',
  summary: '📝',
  note: '📋',
  unknown: '❓',
});

export const TRACE_COLORS = /** @type {const} */ ({
  user: 'blue',
  agent: 'white',
  summary: 'yellow',
  command: 'green',
  apply_patch: 'cyan',
  write_file: 'magenta',
  note: 'white',
  unknown: 'gray',
  error: 'red',
});
