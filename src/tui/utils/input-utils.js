export const isEnterKey = (key) => !!(key && key.return);

export const isBackKey = (input, key) =>
  !!((key && key.escape) || input === 'q');

export const isExitKey = (input, key) =>
  isEnterKey(key) || isBackKey(input, key);
