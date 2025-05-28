import React from 'react';
import { Text } from 'ink';

export const LineRenderer = ({ line, selected = false, isModal = false }) => {
  if (!line) return null;

  // Determine color: respect line.color, with modal overrides
  let color = line.color || 'white';
  if (isModal && line.dimOnModal) {
    color = 'white';
  }

  // Determine if dimmed
  const dimColor = line.dim || false;

  // Determine if bold (headers are bold, selected items can be bold)
  const bold = line.bold || (selected && !dimColor);

  // Render the text with icon if present
  const displayText = line.icon ? `${line.icon} ${line.text}` : line.text;

  return React.createElement(
    Text,
    {
      color,
      dimColor,
      bold,
      wrap: 'truncate-end',
    },
    displayText
  );
};
