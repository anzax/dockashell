import { useState, useRef, useEffect } from 'react';
import { DEFAULT_FILTERS } from '../utils/entry-utils.js';

export const useFilters = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilterView, setShowFilterView] = useState(false);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  return {
    filters,
    setFilters,
    showFilterView,
    setShowFilterView,
    filtersRef,
  };
};
