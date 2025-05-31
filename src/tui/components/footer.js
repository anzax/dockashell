import React from 'react';
import { Text } from 'ink';
import { useStore } from '@nanostores/react';
import { $uiState } from '../stores/ui-store.js';
import { SHORTCUTS, buildFooter } from '../ui-utils/constants.js';

export const Footer = () => {
  const { activeView } = useStore($uiState);
  let shortcuts = [];
  switch (activeView) {
    case 'selector':
      shortcuts = [SHORTCUTS.NAVIGATE, SHORTCUTS.OPEN, SHORTCUTS.QUIT];
      break;
    case 'log':
      shortcuts = [
        SHORTCUTS.NAVIGATE,
        SHORTCUTS.DETAIL,
        SHORTCUTS.PAGE,
        SHORTCUTS.TOP_BOTTOM,
        SHORTCUTS.FILTER,
        SHORTCUTS.REFRESH,
        SHORTCUTS.BACK_B,
        SHORTCUTS.QUIT,
      ];
      break;
    case 'details':
      shortcuts = [
        SHORTCUTS.LINE,
        SHORTCUTS.PAGE,
        SHORTCUTS.TOP_BOTTOM,
        SHORTCUTS.PREV_NEXT,
        SHORTCUTS.EXIT,
      ];
      break;
    case 'filter':
      shortcuts = [
        SHORTCUTS.NAVIGATE,
        SHORTCUTS.TOGGLE,
        SHORTCUTS.APPLY,
        SHORTCUTS.EXIT,
      ];
      break;
    default:
      break;
  }
  return React.createElement(
    Text,
    { dimColor: true, wrap: 'truncate-end' },
    buildFooter(...shortcuts)
  );
};
