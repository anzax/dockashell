import React from 'react';
import { Box, Text } from 'ink';
import { TextLayout } from '../ui-utils/text-utils.js';
import { detectTraceType } from '../ui-utils/entry-utils.js';
import { getDecorator } from '../event-decorators/index.js';
import { LAYOUT } from '../ui-utils/constants.js';

export const buildCompactLines = (
  entry,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  const kind = detectTraceType(entry);
  const deco = getDecorator(kind);
  const width = new TextLayout(terminalWidth).contentWidth;
  return [deco.headerLine(entry), deco.contentCompact(entry, width)];
};

export const buildFullLines = (
  entry,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  const kind = detectTraceType(entry);
  const deco = getDecorator(kind);
  const width = new TextLayout(terminalWidth).contentWidth;
  return [deco.headerLine(entry), ...deco.contentFull(entry, width)];
};

export const TraceItemPreview = ({
  trace,
  selected = false,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH,
}) => {
  // Defensive programming: handle undefined/null trace
  if (!trace) {
    return React.createElement(
      Box,
      {
        flexDirection: 'column',
        paddingLeft: 1,
        paddingRight: 1,
        marginBottom: 1,
      },
      React.createElement(Text, { color: 'red' }, 'Error: Invalid trace data')
    );
  }

  const kind = detectTraceType(trace);
  const deco = getDecorator(kind);
  const width = new TextLayout(terminalWidth).contentWidth;

  const headerLine = deco.headerLine(trace);
  const contentLine = deco.contentCompact(trace, width);

  const renderLine = (line) => {
    const color = line.color || 'white';
    const bold = line.bold || (selected && !(line.dim || false));
    const text = line.icon ? `${line.icon} ${line.text}` : line.text;

    return React.createElement(
      Text,
      {
        color,
        dimColor: line.dim || false,
        bold,
        wrap: 'truncate-end',
      },
      text
    );
  };

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: selected ? 'single' : undefined,
      borderColor: selected ? 'cyan' : undefined,
      paddingLeft: 1,
      paddingRight: 1,
      marginBottom: 1,
    },
    renderLine(headerLine),
    renderLine(contentLine)
  );
};
