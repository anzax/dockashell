import React, { useState } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner.js';

export const useTraceBuffer = () => {
  const [buffer, setBuffer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const spinner = loading ? React.createElement(LoadingSpinner, {}) : null;

  return { buffer, setBuffer, entries, setEntries, loading: spinner, setLoading };
};
