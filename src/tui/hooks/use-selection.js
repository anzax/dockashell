import { useState, useCallback } from 'react';

export const useSelection = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  const ensureVisible = useCallback(
    (index, entries, terminalHeight, getEntryHeight) => {
      if (entries.length === 0) return;
      let offset = scrollOffset;
      if (index < offset) {
        offset = index;
      } else {
        const availableHeight = terminalHeight - 3;
        let height = 0;
        for (let i = index; i >= offset; i--) {
          height += getEntryHeight(entries[i], i === index);
          if (height > availableHeight) {
            offset = i + 1;
            break;
          }
        }
      }
      offset = Math.min(Math.max(offset, 0), entries.length - 1);
      setScrollOffset(offset);
    },
    [scrollOffset]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    scrollOffset,
    setScrollOffset,
    ensureVisible,
  };
};
