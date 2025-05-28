import { useState, useCallback, useMemo } from 'react';
import { useStdoutDimensions } from './useStdoutDimensions.js';

export const useVirtualList = ({ totalCount, getItem, getItemHeight }) => {
  const [, terminalHeight] = useStdoutDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const ensureVisible = useCallback(
    (index) => {
      if (totalCount === 0) return;
      let offset = scrollOffset;
      if (index < offset) {
        offset = index;
      } else {
        const availableHeight = terminalHeight - 3;
        let height = 0;
        for (let i = index; i >= offset; i--) {
          const item = getItem(i);
          height += getItemHeight(item, i === index);
          if (height > availableHeight) {
            offset = i + 1;
            break;
          }
        }
      }
      offset = Math.min(Math.max(offset, 0), Math.max(0, totalCount - 1));
      setScrollOffset(offset);
    },
    [scrollOffset, terminalHeight, totalCount, getItem, getItemHeight]
  );

  const calculateVisibleRange = useCallback(() => {
    if (totalCount === 0) return { start: 0, end: 0 };
    const availableHeight = terminalHeight - 3;
    let height = 0;
    let end = scrollOffset;
    while (
      end < totalCount &&
      height + getItemHeight(getItem(end), end === selectedIndex) <=
        availableHeight
    ) {
      height += getItemHeight(getItem(end), end === selectedIndex);
      end++;
    }
    return { start: scrollOffset, end };
  }, [
    scrollOffset,
    totalCount,
    terminalHeight,
    selectedIndex,
    getItem,
    getItemHeight,
  ]);

  const { start: visibleStart, end: visibleEnd } = calculateVisibleRange();

  const visibleItems = useMemo(() => {
    const list = [];
    for (let i = visibleStart; i < visibleEnd; i++) {
      list.push({ index: i, item: getItem(i) });
    }
    return list;
  }, [visibleStart, visibleEnd, getItem]);

  const pageSize = useCallback(() => {
    const { start, end } = calculateVisibleRange();
    return end - start || 1;
  }, [calculateVisibleRange]);

  return {
    visibleItems,
    visibleStart,
    visibleEnd,
    selectedIndex,
    setSelectedIndex,
    scrollOffset,
    setScrollOffset,
    ensureVisible,
    pageSize,
  };
};

export default useVirtualList;
