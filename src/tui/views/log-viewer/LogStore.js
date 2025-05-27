import React, { createContext, useContext, useReducer } from 'react';
import { DEFAULT_FILTERS } from '../../utils/entry-utils.js';

const initialState = {
  filters: DEFAULT_FILTERS,
  search: '',
  scrollOffset: 0,
  selectedIndex: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'setFilters':
      return { ...state, filters: action.filters };
    case 'setSearch':
      return { ...state, search: action.search };
    case 'setSelectedIndex':
      return { ...state, selectedIndex: action.index };
    case 'setScroll':
      return { ...state, scrollOffset: action.offset };
    default:
      return state;
  }
}

const LogStoreContext = createContext(null);

export const LogStoreProvider = ({ children }) => {
  const value = useReducer(reducer, initialState);
  return React.createElement(LogStoreContext.Provider, { value }, children);
};

export const useLogStore = () => {
  const ctx = useContext(LogStoreContext);
  if (!ctx) throw new Error('useLogStore must be used within LogStoreProvider');
  return ctx;
};
