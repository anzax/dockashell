import { useEffect } from 'react';

/**
 * Hook that enables mouse reporting in the terminal
 * Sends escape sequences to enable SGR mouse mode on mount
 * and disables it on unmount for proper cleanup
 *
 * Also handles process signals to ensure mouse mode is disabled
 * even on abnormal termination (Ctrl+C, crashes, etc.)
 */
export const useTerminalMouseMode = () => {
  useEffect(() => {
    // Mouse mode control sequences
    const enableSequences = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';
    const disableSequences = '\x1b[?1006l\x1b[?1002l\x1b[?1000l';

    // Function to disable mouse mode
    const disableMouseMode = () => {
      try {
        process.stdout.write(disableSequences);
      } catch {
        // Ignore errors during cleanup (stdout might be closed)
      }
    };

    // Enable mouse reporting

    process.stdout.write(enableSequences);

    // Register signal handlers to ensure cleanup on abnormal exit
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    const signalHandlers = signals.map((signal) => {
      const handler = () => {
        disableMouseMode();
        process.exit(0);
      };
      process.on(signal, handler);
      return { signal, handler };
    });

    // Fallback: disable on any exit
    const exitHandler = () => disableMouseMode();
    process.on('exit', exitHandler);

    // Cleanup function to disable mouse reporting
    return () => {
      // Remove signal handlers
      signalHandlers.forEach(({ signal, handler }) => {
        process.off(signal, handler);
      });
      process.off('exit', exitHandler);

      // Disable mouse mode
      disableMouseMode();
    };
  }, []);
};
