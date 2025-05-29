export const parseMouse = (data) => {
  // eslint-disable-next-line no-control-regex
  const match = /\x1b\[<(?<code>\d+);(?<x>\d+);(?<y>\d+)(?<type>[mM])/u.exec(
    data.toString()
  );
  if (!match) return null;
  const code = Number(match.groups.code);
  const x = Number(match.groups.x);
  const y = Number(match.groups.y);
  const isRelease = match.groups.type === 'm';
  let wheel;
  let button;
  if (code === 64) wheel = 'up';
  else if (code === 65) wheel = 'down';
  else if ((code & 3) === 0) button = 'left';
  else if ((code & 3) === 1) button = 'middle';
  else if ((code & 3) === 2) button = 'right';
  return { code, x, y, isRelease, wheel, button };
};

import { useEffect } from 'react';
import { useStdin } from 'ink';

export const useMouseInput = (handler) => {
  const { stdin } = useStdin();
  useEffect(() => {
    if (!stdin || !handler) return undefined;
    const onData = (d) => {
      const evt = parseMouse(d);
      if (evt) handler(evt);
    };
    stdin.on('data', onData);
    return () => stdin.off('data', onData);
  }, [stdin, handler]);
};
