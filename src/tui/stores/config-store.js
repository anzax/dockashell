import { atom } from 'nanostores';
import { DEFAULT_GLOBAL_CONFIG } from '../../utils/default-config.js';
import { loadConfig } from '../../utils/config.js';

export const $appConfig = atom({ ...DEFAULT_GLOBAL_CONFIG });

loadConfig()
  .then((cfg) => $appConfig.set(cfg))
  .catch(() => {});

export function updateConfig(cfg) {
  $appConfig.set(cfg);
}
