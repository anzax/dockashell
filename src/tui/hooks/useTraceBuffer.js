import { useState } from 'react';

export const useTraceBuffer = () => {
  const [buffer, setBuffer] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  return { buffer, setBuffer, entries, setEntries, loading, setLoading };
};
