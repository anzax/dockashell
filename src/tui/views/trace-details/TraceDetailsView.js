import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { LineRenderer } from '../log-viewer/LineRenderer.js';
import { AppContainer } from '../AppContainer.js';
import { useStdoutDimensions } from '../../hooks/useStdoutDimensions.js';
import { buildEntryLines } from '../../utils/entry-utils.js';
import { SHORTCUTS, buildFooter } from '../../constants/shortcuts.js';

export const TraceDetailsView = ({
  traces,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalWidth, height] = useStdoutDimensions();

  const currentTrace = traces[currentIndex];
  if (!currentTrace) {
    return React.createElement(AppContainer, {
      header: React.createElement(Text, { bold: true }, 'Trace Details'),
      footer: React.createElement(
        Text,
        { dimColor: true },
        buildFooter(SHORTCUTS.EXIT)
      ),
      children: React.createElement(
        Box,
        { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
        React.createElement(Text, { wrap: 'truncate-end' }, 'No trace selected')
      ),
    });
  }

  // Generate full lines on-demand using the decorator system
  const fullLines = buildEntryLines(
    currentTrace.entry,
    false,
    terminalWidth - 2 // Account for border width (1 char on each side)
  );

  // Calculate viewport and visible lines
  const viewportHeight = Math.max(1, height - 6); // Account for: header(1) + marginTop(1) + marginBottom(1) + footer(1) + borderTop(1) + borderBottom(1)
  const maxScrollOffset = Math.max(0, fullLines.length - viewportHeight);
  const visibleLines = fullLines.slice(
    scrollOffset,
    scrollOffset + viewportHeight
  );

  const hasNext = currentIndex < traces.length - 1;
  const hasPrev = currentIndex > 0;

  useInput((input, key) => {
    // Navigation between traces (simplified - no Alt required)
    if (key.leftArrow && hasPrev) {
      onNavigate(currentIndex - 1);
      setScrollOffset(0); // Reset scroll when changing traces
    } else if (key.rightArrow && hasNext) {
      onNavigate(currentIndex + 1);
      setScrollOffset(0); // Reset scroll when changing traces
    }
    // Scrolling
    else if (key.upArrow) {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setScrollOffset((prev) => Math.min(maxScrollOffset, prev + 1));
    } else if (key.pageUp) {
      setScrollOffset((prev) => Math.max(0, prev - viewportHeight));
    } else if (key.pageDown) {
      setScrollOffset((prev) =>
        Math.min(maxScrollOffset, prev + viewportHeight)
      );
    } else if (key.ctrl && input === 'u') {
      // Ctrl+U as alternative to Page Up
      setScrollOffset((prev) => Math.max(0, prev - viewportHeight));
    } else if (key.ctrl && input === 'd') {
      // Ctrl+D as alternative to Page Down
      setScrollOffset((prev) =>
        Math.min(maxScrollOffset, prev + viewportHeight)
      );
    } else if (input === 'g') {
      setScrollOffset(0);
    } else if (input === 'G') {
      setScrollOffset(maxScrollOffset);
    }
    // Close view
    else if (key.escape || key.return || input === 'q') {
      onClose();
    }
  });

  const navigationIndicator = ` (${currentIndex + 1}/${traces.length})`;

  // Show scroll indicator only if content is scrollable
  const scrollable = fullLines.length > viewportHeight;
  const scrollIndicator = scrollable
    ? ` (${scrollOffset + 1}-${Math.min(fullLines.length, scrollOffset + viewportHeight)} of ${fullLines.length})`
    : '';

  return React.createElement(AppContainer, {
    header: React.createElement(
      Text,
      { bold: true, wrap: 'truncate-end' },
      `Trace Details${navigationIndicator}${scrollIndicator}`
    ),
    footer: React.createElement(
      Text,
      { dimColor: true, wrap: 'truncate-end' },
      buildFooter(
        SHORTCUTS.LINE,
        SHORTCUTS.PAGE,
        SHORTCUTS.TOP_BOTTOM,
        SHORTCUTS.PREV_NEXT,
        SHORTCUTS.EXIT
      )
    ),
    children: React.createElement(
      Box,
      {
        flexDirection: 'column',
        flexGrow: 1,
        borderStyle: 'single',
      },
      ...visibleLines.map((line, idx) =>
        React.createElement(LineRenderer, {
          key: scrollOffset + idx,
          line,
          isModal: true,
        })
      )
    ),
  });
};
