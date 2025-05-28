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
  agent: 'yellow',
  summary: 'green',
  command: 'white',
  apply_patch: 'cyan',
  write_file: 'magenta',
  note: 'white',
  unknown: 'gray',
});
