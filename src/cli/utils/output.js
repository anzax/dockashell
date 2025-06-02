import pc from 'picocolors';

export function success(text) {
  return pc.green(text);
}

export function error(text) {
  return pc.red(text);
}

export function warn(text) {
  return pc.yellow(text);
}

export function info(text) {
  return pc.cyan(text);
}

export function bold(text) {
  return pc.bold(text);
}

export const colors = pc;
