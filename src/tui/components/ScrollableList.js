import React from 'react';
import { Box } from 'ink';

export const ScrollableList = ({ list, renderItem }) =>
  React.createElement(
    Box,
    { flexDirection: 'column', flexGrow: 1 },
    ...list.visibleItems.map(({ item, index }) =>
      renderItem(item, index, index === list.selectedIndex)
    )
  );

export default ScrollableList;
