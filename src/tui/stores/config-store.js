import { atom } from 'nanostores';
import { defaultConfig } from '../../utils/default-config.js';
import { loadConfig } from '../../utils/config.js';

export const $appConfig = atom({ ...defaultConfig });

loadConfig()
  .then((cfg) => $appConfig.set(cfg))
  .catch(() => {});

export function updateConfig(cfg) {
  $appConfig.set(cfg);
}
