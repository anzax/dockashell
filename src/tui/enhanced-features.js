// Enhanced TUI features for potential future integration

export const TUI_FEATURES = {
  // Advanced terminal handling
  TERMINAL_HANDLING: {
    minHeight: 10,
    minWidth: 40,
    reservedLines: 4, // header + help + padding
    fallbackDimensions: { width: 80, height: 24 }
  },

  // Display optimizations
  DISPLAY: {
    maxLinesPerEntry: 5,
    maxEntries: 1000,
    refreshInterval: 5000, // Auto-refresh every 5s if desired
    colorScheme: {
      selected: 'cyan',
      header: 'bold',
      help: 'dim',
      error: 'red',
      command: 'green',
      note: 'yellow'
    }
  },

  // Keyboard shortcuts
  SHORTCUTS: {
    navigation: {
      up: 'upArrow',
      down: 'downArrow',
      pageUp: 'pageUp',
      pageDown: 'pageDown',
      top: 'g',
      bottom: 'G'
    },
    actions: {
      refresh: 'r',
      back: 'b',
      quit: 'q',
      help: '?',
      search: '/',
      filter: 'f'
    }
  }
};

// Terminal utilities
export const getTerminalDimensions = (stdout) => {
  const width = stdout?.columns || process.stdout.columns || TUI_FEATURES.TERMINAL_HANDLING.fallbackDimensions.width;
  const height = stdout?.rows || process.stdout.rows || TUI_FEATURES.TERMINAL_HANDLING.fallbackDimensions.height;
  
  return {
    width: Math.max(width, TUI_FEATURES.TERMINAL_HANDLING.minWidth),
    height: Math.max(height, TUI_FEATURES.TERMINAL_HANDLING.minHeight)
  };
};

export const calculateMaxVisibleEntries = (terminalHeight) => {
  return Math.max(1, terminalHeight - TUI_FEATURES.TERMINAL_HANDLING.reservedLines);
};

// Future enhancements placeholder
export const FUTURE_FEATURES = {
  search: false,
  filter: false,
  autoRefresh: false,
  colorCustomization: false,
  exportLogs: false
};
