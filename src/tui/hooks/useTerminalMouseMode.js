import { useEffect } from 'react';

/**
 * Hook that enables mouse reporting in the terminal
 * Sends escape sequences to enable SGR mouse mode on mount
 * and disables it on unmount for proper cleanup
 */
export const useTerminalMouseMode = () => {
  useEffect(() => {
    // Enable mouse reporting
    // 1000: Basic mouse reporting
    // 1002: Button event tracking (includes drag)
    // 1006: SGR extended reporting (format we parse)
    const enableSequences = [
      '\x1b[?1000h', // Enable basic mouse reporting
      '\x1b[?1002h', // Enable button event tracking
      '\x1b[?1006h', // Enable SGR extended reporting
    ].join('');

    process.stdout.write(enableSequences);

    // Cleanup function to disable mouse reporting
    return () => {
      const disableSequences = [
        '\x1b[?1006l', // Disable SGR extended reporting
        '\x1b[?1002l', // Disable button event tracking
        '\x1b[?1000l', // Disable basic mouse reporting
      ].join('');

      process.stdout.write(disableSequences);
    };
  }, []);
};
