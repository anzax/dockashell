import { useState, useEffect } from 'react';
import { useStdout } from 'ink';

/**
 * Hook to get stdout dimensions that automatically updates on terminal resize.
 * Compatible API with ink-use-stdout-dimensions but without external dependencies.
 *
 * @returns {[number, number]} A tuple of [width, height]
 */
export const useStdoutDimensions = () => {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState(() => [
    stdout?.columns || process.stdout?.columns || 80,
    stdout?.rows || process.stdout?.rows || 24,
  ]);

  useEffect(() => {
    const updateDimensions = () => {
      const width = stdout?.columns || process.stdout?.columns || 80;
      const height = stdout?.rows || process.stdout?.rows || 24;
      setDimensions([width, height]);
    };

    updateDimensions();
    process.stdout?.on('resize', updateDimensions);
    return () => process.stdout?.off('resize', updateDimensions);
  }, [stdout]);

  return dimensions;
};

export default useStdoutDimensions;
