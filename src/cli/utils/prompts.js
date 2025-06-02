import { createInterface } from 'readline';

export async function confirm(message, defaultValue = false) {
  if (process.env.DS_AUTO_CONFIRM) {
    return defaultValue;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const suffix = defaultValue ? ' [Y/n]' : ' [y/N]';

  return new Promise((resolve) => {
    rl.question(message + suffix + ' ', (answer) => {
      rl.close();
      if (!answer) {
        resolve(defaultValue);
        return;
      }
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}
