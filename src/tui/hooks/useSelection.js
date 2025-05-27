import { useState, useRef, useEffect, useCallback } from 'react';

export const useSelection = (entries = []) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [detailsViewIndex, setDetailsViewIndex] = useState(null);
  const detailsViewRef = useRef(null);
  const selectedTimestampRef = useRef(null);
  const detailsTimestampRef = useRef(null);
  const [selectionBeforeFilter, setSelectionBeforeFilter] = useState(null);

  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
    selectedTimestampRef.current = entries[selectedIndex]?.entry.timestamp || null;
  }, [selectedIndex, entries]);

  useEffect(() => {
    detailsViewRef.current = detailsViewIndex;
    if (detailsViewIndex !== null) {
      detailsTimestampRef.current = entries[detailsViewIndex]?.entry.timestamp || null;
    }
  }, [detailsViewIndex, entries]);

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
    selectedIndexRef,
    selectedTimestampRef,
    scrollOffset,
    setScrollOffset,
    detailsViewIndex,
    setDetailsViewIndex,
    detailsViewRef,
    detailsTimestampRef,
    selectionBeforeFilter,
    setSelectionBeforeFilter,
    ensureVisible,
  };
};
