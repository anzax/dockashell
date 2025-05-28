import React from 'react';
import { Box } from 'ink';
import { useStdoutDimensions } from '../hooks/useStdoutDimensions.js';

/**
 * Standard full screen layout with header and footer.
 * Takes entire terminal space with no padding and optional spacing
 * between sections.
 */
export const AppContainer = ({ header, footer, children }) => {
  const [, height] = useStdoutDimensions();
  return React.createElement(
    Box,
    { flexDirection: 'column', height, width: '100%' },
    React.createElement(Box, { flexShrink: 0 }, header),
    React.createElement(
      Box,
      { flexGrow: 1, marginTop: 1, marginBottom: 1, width: '100%' },
      children
    ),
    React.createElement(Box, { flexShrink: 0 }, footer)
  );
};
