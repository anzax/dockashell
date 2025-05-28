import { useState } from 'react';

export const useTraceBuffer = () => {
  const [buffer, setBuffer] = useState(null);
  const [entries, setEntries] = useState([]);

  return { buffer, setBuffer, entries, setEntries };
};
