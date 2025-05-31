import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useStdoutDimensions } from './use-stdout-dimensions.js';

/**
 * Hook to manage large lists with virtual scrolling.
 *
 * @param {object} options
 * @param {number} options.totalCount - Total number of items.
 * @param {(index: number) => any} options.getItem - Retrieve an item by index.
 * @param {(item: any, selected: boolean) => number} options.getItemHeight -
 *   Get the height of an item.
 * @returns {object} Virtual list state and helpers.
 */

export const useVirtualList = ({
  totalCount,
  getItem,
  getItemHeight,
  selectedIndex,
  scrollOffset,
  onSelectionChange,
  onScrollChange,
}) => {
  const [, terminalHeight] = useStdoutDimensions();
  const cacheRef = useRef(new Map());

  useEffect(() => {
    cacheRef.current.clear();
  }, [getItem, totalCount]);

  const getCachedItem = useCallback(
    (idx) => {
      if (idx < 0 || idx >= totalCount) return undefined;
      if (!cacheRef.current.has(idx)) {
        cacheRef.current.set(idx, getItem(idx));
      }
      return cacheRef.current.get(idx);
    },
    [getItem, totalCount]
  );

  const ensureVisible = useCallback(
    (index) => {
      if (totalCount === 0) return;
      const idx = Math.min(Math.max(index, 0), totalCount - 1);
      let offset = scrollOffset;
      if (idx < offset) {
        offset = idx;
      } else {
        const availableHeight = terminalHeight - 4; // header(1) + marginTop(1) + marginBottom(1) + footer(1)
        let height = 0;
        for (let i = idx; i >= offset; i--) {
          const item = getCachedItem(i);
          height += getItemHeight(item, i === idx);
          if (height > availableHeight) {
            offset = i + 1;
            break;
          }
        }
      }
      offset = Math.min(Math.max(offset, 0), Math.max(0, totalCount - 1));
      if (offset !== scrollOffset) onScrollChange?.(offset);
    },
    [
      scrollOffset,
      terminalHeight,
      totalCount,
      getCachedItem,
      getItemHeight,
      onScrollChange,
    ]
  );

  const calculateVisibleRange = useCallback(() => {
    if (totalCount === 0) return { start: 0, end: 0 };
    const availableHeight = terminalHeight - 4; // header(1) + marginTop(1) + marginBottom(1) + footer(1)
    let height = 0;
    let end = scrollOffset;
    while (
      end < totalCount &&
      height + getItemHeight(getCachedItem(end), end === selectedIndex) <=
        availableHeight
    ) {
      height += getItemHeight(getCachedItem(end), end === selectedIndex);
      end++;
    }
    return { start: scrollOffset, end };
  }, [
    scrollOffset,
    totalCount,
    terminalHeight,
    selectedIndex,
    getCachedItem,
    getItemHeight,
  ]);

  const { start: visibleStart, end: visibleEnd } = calculateVisibleRange();

  const visibleItems = useMemo(() => {
    const list = [];
    for (let i = visibleStart; i < visibleEnd; i++) {
      list.push({ index: i, item: getCachedItem(i) });
    }
    return list;
  }, [visibleStart, visibleEnd, getCachedItem]);

  const pageSize = useCallback(() => {
    const { start, end } = calculateVisibleRange();
    return end - start || 1;
  }, [calculateVisibleRange]);

  return {
    visibleItems,
    visibleStart,
    visibleEnd,
    selectedIndex,
    setSelectedIndex: onSelectionChange,
    scrollOffset,
    setScrollOffset: onScrollChange,
    ensureVisible,
    pageSize,
  };
};

export default useVirtualList;
