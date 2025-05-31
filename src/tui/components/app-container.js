import React from 'react';
import { Box } from 'ink';

/**
 * Standard full screen layout with header.
 * Takes entire terminal space with no padding and optional spacing between
 * sections.
 */
export const AppContainer = ({ header, children }) => {
  return React.createElement(
    Box,
    { flexDirection: 'column', flexGrow: 1, width: '100%' },
    React.createElement(Box, { flexShrink: 0 }, header),
    React.createElement(
      Box,
      { flexGrow: 1, marginTop: 1, marginBottom: 1, width: '100%' },
      children
    )
  );
};
