import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useStore } from '@nanostores/react';
import {
  $traceSelection,
  dispatch as traceDispatch,
} from '../stores/trace-selection-store.js';
import { useMouseInput } from '../hooks/use-mouse-input.js';
import { AppContainer } from '../components/app-container.js';
import { useStdoutDimensions } from '../hooks/use-stdout-dimensions.js';
import { buildFullLines } from '../components/trace-item-preview.js';
import { dispatch as uiDispatch } from '../stores/ui-store.js';
import { isExitKey } from '../ui-utils/text-utils.js';

export const TraceDetailsView = () => {
  // Get details state from store
  const { detailsState } = useStore($traceSelection);

  if (!detailsState) {
    return React.createElement(AppContainer, {
      header: React.createElement(Text, { bold: true }, 'Trace Details'),
      children: React.createElement(
        Box,
        { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
        React.createElement(Text, { wrap: 'truncate-end' }, 'No details state')
      ),
    });
  }

  const { traces, currentIndex } = detailsState;

  const [scrollOffset, setScrollOffset] = useState(0);
  const [terminalWidth, height] = useStdoutDimensions();

  const currentTrace = traces[currentIndex];
  if (!currentTrace) {
    return React.createElement(AppContainer, {
      header: React.createElement(Text, { bold: true }, 'Trace Details'),
      children: React.createElement(
        Box,
        { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
        React.createElement(Text, { wrap: 'truncate-end' }, 'No trace selected')
      ),
    });
  }

  // Generate full lines on-demand using the decorator system
  const fullLines = buildFullLines(
    currentTrace.trace,
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
      traceDispatch({ type: 'navigate-details', index: currentIndex - 1 });
      setScrollOffset(0); // Reset scroll when changing traces
    } else if (key.rightArrow && hasNext) {
      traceDispatch({ type: 'navigate-details', index: currentIndex + 1 });
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
    else if (isExitKey(input, key)) {
      uiDispatch({ type: 'close-details' });
    }
  });

  useMouseInput((evt) => {
    if (evt.wheel === 'up') {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    } else if (evt.wheel === 'down') {
      setScrollOffset((prev) => Math.min(maxScrollOffset, prev + 1));
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
    children: React.createElement(
      Box,
      {
        flexDirection: 'column',
        flexGrow: 1,
        borderStyle: 'single',
      },
      ...visibleLines.map((line, idx) =>
        React.createElement(
          Text,
          {
            key: scrollOffset + idx,
            color: line.dimOnModal ? 'white' : line.color || 'white',
            dimColor: line.dim || false,
            bold: line.bold || false,
            wrap: 'truncate-end',
          },
          line.icon ? `${line.icon} ${line.text}` : line.text
        )
      )
    ),
  });
};
