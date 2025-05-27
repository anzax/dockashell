import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { LAYOUT } from '../../../constants/layout.js';
import { LineRenderer } from '../log-viewer/LineRenderer.js';

export const TraceDetailsView = ({
  traces,
  currentIndex,
  onClose,
  onNavigate,
  height,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const currentTrace = traces[currentIndex];
  if (!currentTrace) {
    return React.createElement(
      Box,
      { flexDirection: 'column', height },
      React.createElement(Text, { wrap: 'truncate-end' }, 'No trace selected')
    );
  }
  const availableHeight = Math.max(
    1,
    height - LAYOUT.HEADER_HEIGHT
  ); // Header, help, borders only
  const maxOffset = Math.max(
    0,
    currentTrace.fullLines.length - availableHeight
  );
  const visibleLines = currentTrace.fullLines.slice(
    scrollOffset,
    scrollOffset + availableHeight
  );

  const hasNext = currentIndex < traces.length - 1;
  const hasPrev = currentIndex > 0;

  useInput((input, key) => {
    // Navigation between traces (simplified - no Alt required)
    if (key.leftArrow && hasPrev) {
      onNavigate(currentIndex - 1);
      setScrollOffset(0); // Reset scroll when switching traces
    } else if (key.rightArrow && hasNext) {
      onNavigate(currentIndex + 1);
      setScrollOffset(0); // Reset scroll when switching traces
    }
    // Content scrolling
    else if (key.downArrow) {
      setScrollOffset((o) => Math.min(maxOffset, o + 1));
    } else if (key.upArrow) {
      setScrollOffset((o) => Math.max(0, o - 1));
    } else if (key.pageDown) {
      setScrollOffset((o) => Math.min(maxOffset, o + availableHeight));
    } else if (key.pageUp) {
      setScrollOffset((o) => Math.max(0, o - availableHeight));
    } else if (input === 'g') {
      setScrollOffset(0);
    } else if (input === 'G') {
      setScrollOffset(maxOffset);
    }
    // Close modal
    else if (key.escape || key.return || input === 'q') {
      onClose();
    }
  });

  const scrollIndicator =
    currentTrace.fullLines.length > availableHeight
      ? ` (${scrollOffset + 1}-${Math.min(
          currentTrace.fullLines.length,
          scrollOffset + availableHeight
        )} of ${currentTrace.fullLines.length})`
      : '';

  const navigationIndicator = ` (${currentIndex + 1}/${traces.length})`;

  return React.createElement(
    Box,
    { flexDirection: 'column', height },
    React.createElement(
      Text,
      { bold: true, wrap: 'truncate-end' },
      `Trace Details${navigationIndicator}${scrollIndicator}`
    ),

    React.createElement(
      Box,
      {
        flexDirection: 'column',
        flexGrow: 1,
        borderStyle: 'double',
        paddingLeft: 1,
        paddingRight: 1,
        marginY: 1,
      },
      ...visibleLines.map((line, idx) =>
        React.createElement(LineRenderer, {
          key: scrollOffset + idx,
          line,
          isModal: true,
        })
      )
    ),

    React.createElement(
      Text,
      { dimColor: true, wrap: 'truncate-end' },
      '[↑↓ PgUp/PgDn g/G] Scroll  ' +
        (hasPrev || hasNext ? '[←/→] Navigate  ' : '') +
        '[Enter/Esc/q] Close'
    )
  );
};
