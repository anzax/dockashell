import { useRef, useState, useEffect } from 'react';

export const useAutoScroll = () => {
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  const updateAutoScrollState = (index, total) => {
    const threshold = 5;
    if (total - index > threshold) {
      setAutoScroll(false);
    } else if (index >= total - 1) {
      setAutoScroll(true);
    }
  };

  return { autoScroll, setAutoScroll, autoScrollRef, updateAutoScrollState };
};
