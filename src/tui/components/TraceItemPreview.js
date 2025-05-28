import React from 'react';
import { Box, Text } from 'ink';
import { getDecorator } from '../event-decorators/index.js';
import { TextLayout } from '../ui-utils/text-utils.js';
import { detectTraceType } from '../ui-utils/entry-utils.js';
import { LAYOUT } from '../ui-utils/constants.js';

export const buildEntryLines = (
  entry,
  mode = 'compact',
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  const kind = detectTraceType(entry);
  const deco = getDecorator(kind);
  const width = new TextLayout(terminalWidth).contentWidth;
  if (mode === 'compact') {
    return [deco.headerLine(entry), deco.contentCompact(entry, width)];
  }
  return [deco.headerLine(entry), ...deco.contentFull(entry, width)];
};

export const TraceItemPreview = ({
  trace,
  mode = 'compact',
  selected = false,
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH,
}) => {
  const lines = buildEntryLines(trace, mode, terminalWidth);
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
    ...lines.map((line, idx) =>
      React.createElement(
        Text,
        {
          key: idx,
          color:
            mode === 'full' && line.dimOnModal
              ? 'white'
              : line.color || 'white',
          dimColor: line.dim || false,
          bold: line.bold || (selected && !(line.dim || false)),
          wrap: 'truncate-end',
        },
        line.icon ? `${line.icon} ${line.text}` : line.text
      )
    )
  );
};

TraceItemPreview.getHeight = (
  entry,
  selected = false,
  mode = 'compact',
  terminalWidth = LAYOUT.DEFAULT_TERMINAL_WIDTH
) => {
  const lines = buildEntryLines(entry, mode, terminalWidth);
  return lines.length + 1 + (selected ? 2 : 0);
};
