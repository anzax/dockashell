#!/usr/bin/env node
// Debug script to test TUI terminal sizing and display
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useStdout } from 'ink';

const DebugApp = () => {
  const [terminalSize, setTerminalSize] = useState({ width: 0, height: 0 });
  const [resizeCount, setResizeCount] = useState(0);
  const { stdout } = useStdout();

  useEffect(() => {
    const updateSize = () => {
      const width = stdout?.columns || process.stdout.columns || 80;
      const height = stdout?.rows || process.stdout.rows || 24;
      setTerminalSize({ width, height });
      setResizeCount(c => c + 1);
    };

    updateSize();

    const onResize = () => {
      updateSize();
    };

    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.removeListener('resize', onResize);
    };
  }, [stdout]);

  return React.createElement(Box, {
    flexDirection: 'column',
    height: terminalSize.height,
    width: terminalSize.width
  },
    React.createElement(Text, { bold: true }, 'DockaShell TUI Debug'),
    React.createElement(Text, null, `Terminal: ${terminalSize.width}x${terminalSize.height}`),
    React.createElement(Text, null, `Resize events: ${resizeCount}`),
    React.createElement(Text, null, `Available content height: ${terminalSize.height - 4}`),
    React.createElement(Box, { flexGrow: 1, flexDirection: 'column' },
      ...Array.from({ length: Math.max(0, terminalSize.height - 6) }, (_, i) =>
        React.createElement(Text, { key: i }, `Content line ${i + 1}`)
      )
    ),
    React.createElement(Text, { dimColor: true }, '[Ctrl+C] Exit')
  );
};

render(React.createElement(DebugApp));
