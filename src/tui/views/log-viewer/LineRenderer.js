import React from 'react';
import { Box, Text } from 'ink';

export const LineRenderer = ({ line, selected = false, isModal = false }) => {
  if (!line) return null;

  if (line.type === 'header') {
    const headerText = `${line.icon} ${line.timestamp} [${line.typeText}]`;
    return React.createElement(
      Text,
      { bold: selected, color: line.typeColor, wrap: 'truncate-end' },
      headerText
    );
  }

  if (line.type === 'command') {
    return React.createElement(
      Text,
      {
        bold: selected,
        color: isModal ? 'white' : line.color || 'gray',
        wrap: 'truncate-end',
      },
      line.text
    );
  }

  if (line.type === 'separator') {
    return React.createElement(
      Text,
      { dimColor: true, wrap: 'truncate-end' },
      line.text
    );
  }

  if (line.type === 'status') {
    return React.createElement(
      Box,
      null,
      React.createElement(
        Text,
        { color: line.color, wrap: 'truncate-end' },
        line.text
      ),
      React.createElement(
        Text,
        { dimColor: isModal ? false : true, wrap: 'truncate-end' },
        line.extra
      )
    );
  }

  if (line.type === 'output') {
    return React.createElement(
      Text,
      { color: isModal ? 'white' : 'gray', wrap: 'truncate-end' },
      '  ' + line.text
    );
  }

  return React.createElement(
    Text,
    { color: isModal ? 'white' : line.color || 'gray', wrap: 'truncate-end' },
    line.text
  );
};
