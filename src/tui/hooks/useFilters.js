import { useState, useRef, useEffect } from 'react';
import { DEFAULT_FILTERS } from '../utils/entry-utils.js';

export const useFilters = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [lastFilterState, setLastFilterState] = useState(DEFAULT_FILTERS);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  return {
    filters,
    setFilters,
    lastFilterState,
    setLastFilterState,
    showFilterModal,
    setShowFilterModal,
    filtersRef,
  };
};
