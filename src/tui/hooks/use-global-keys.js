import { useInput } from 'ink';
import { dispatch } from '../stores/ui-store.js';

export const useGlobalKeys = () => {
  useInput((input) => {
    if (input === 'q') {
      dispatch({ type: 'quit' });
    } else if (input === 'b') {
      dispatch({ type: 'back' });
    }
  });
};
