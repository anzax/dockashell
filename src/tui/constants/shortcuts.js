export const SHORTCUTS = /** @type {const} */ ({
  NAVIGATE: '[↑↓] Navigate',
  LINE: '[↑↓] Line',
  SCROLL: '[↑↓] Scroll',
  PAGE: '[PgUp/PgDn] Page',
  TOP_BOTTOM: '[g/G] Top/Bottom',
  DETAIL: '[Enter] Detail',
  OPEN: '[Enter] Open',
  APPLY: '[Enter] Apply',
  TOGGLE: '[Space] Toggle',
  REFRESH: '[r] Refresh',
  FILTER: '[f] Filter',
  BACK_B: '[b] Back',
  PREV_NEXT: '[←/→] Prev/Next',
  EXIT: '[Enter/Esc/q] Back',
  QUIT: '[q] Quit',
});

export const buildFooter = (...items) => items.filter(Boolean).join('  ');
