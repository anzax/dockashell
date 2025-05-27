import { useState, useEffect } from 'react';
import { useStdout } from 'ink';
import { LAYOUT } from '../../constants/layout.js';

export const useTerminalSize = () => {
  const { stdout } = useStdout();
  const [terminalHeight, setTerminalHeight] = useState(20);
  const [terminalWidth, setTerminalWidth] = useState(80);

  useEffect(() => {
    const updateTerminalSize = () => {
      if (stdout?.rows) {
        setTerminalHeight(stdout.rows);
      } else if (process.stdout?.rows) {
        setTerminalHeight(process.stdout.rows);
      } else {
        setTerminalHeight(LAYOUT.DEFAULT_TERMINAL_HEIGHT);
      }

      if (stdout?.columns) {
        setTerminalWidth(stdout.columns);
      } else if (process.stdout?.columns) {
        setTerminalWidth(process.stdout.columns);
      } else {
        setTerminalWidth(LAYOUT.DEFAULT_TERMINAL_WIDTH);
      }
    };

    updateTerminalSize();
    process.stdout.on('resize', updateTerminalSize);
    return () => process.stdout.off('resize', updateTerminalSize);
  }, [stdout]);

  return { terminalHeight, terminalWidth };
};
