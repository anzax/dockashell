import password from '@inquirer/password';
import confirmPrompt from '@inquirer/confirm';
import input from '@inquirer/input';

export async function secureInput(message) {
  return await password({ message });
}

export async function textInput(message, defaultValue) {
  return await input({ message, default: defaultValue });
}

export async function confirm(message, defaultValue = false) {
  if (process.env.DS_AUTO_CONFIRM) {
    return defaultValue;
  }

  return await confirmPrompt({ message, default: defaultValue });
}
