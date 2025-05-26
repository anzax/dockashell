import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

const renderLines = (lines, offset = 0, isModal = true) =>
  lines.map((line, idx) => {
    // Use offset + idx to get the actual position in the full array for stable React keys
    const stableKey = offset + idx;
    if (line.type === 'header') {
      // Use single Text component to avoid layout overlap issues
      const headerText = `${line.icon} ${line.timestamp} [${line.typeText}]`;
      return React.createElement(
        Text,
        {
          key: stableKey,
          color: line.typeColor,
          wrap: 'truncate-end',
        },
        headerText
      );
    }
    if (line.type === 'command') {
      return React.createElement(
        Text,
        {
          key: stableKey,
          bold: false,
          color: isModal ? 'white' : 'gray',
          wrap: 'truncate-end',
        },
        line.text
      );
    }
    if (line.type === 'separator') {
      return React.createElement(
        Text,
        { key: stableKey, dimColor: true, wrap: 'truncate-end' },
        line.text
      );
    }
    if (line.type === 'status') {
      return React.createElement(
        Box,
        { key: stableKey },
        React.createElement(
          Text,
          { color: line.color, wrap: 'truncate-end' },
          line.text
        ),
        React.createElement(
          Text,
          { dimColor: !isModal, wrap: 'truncate-end' },
          line.extra
        )
      );
    }
    if (line.type === 'output') {
      return React.createElement(
        Text,
        {
          key: stableKey,
          color: isModal ? 'white' : 'gray',
          wrap: 'truncate-end',
        },
        '  ' + line.text
      );
    }
    return React.createElement(
      Text,
      {
        key: stableKey,
        color: isModal ? 'white' : 'gray',
        wrap: 'truncate-end',
      },
      line.text
    );
  });

export const TraceDetailsView = ({
  traces,
  currentIndex,
  onClose,
  onNavigate,
  height,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  const currentTrace = traces[currentIndex];
  const availableHeight = Math.max(1, height - 4); // Header, help, borders only
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
      ...renderLines(visibleLines, scrollOffset, true)
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
