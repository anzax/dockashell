import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export const ProjectSelector = ({ onSelect, onExit }) => {
  const [projects, setProjects] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const logsDir = path.join(os.homedir(), '.dockashell', 'logs');
      await fs.ensureDir(logsDir);
      const files = await fs.readdir(logsDir);
      const list = [];
      for (const f of files) {
        if (!f.endsWith('.jsonl')) continue;
        const name = f.replace(/\.jsonl$/, '');
        const file = path.join(logsDir, f);
        const lines = (await fs.readFile(file, 'utf8')).split('\n').filter(Boolean);
        const count = lines.length;
        let last = '';
        if (count > 0) {
          try {
            const obj = JSON.parse(lines[count - 1]);
            last = obj.timestamp;
          } catch {}
        }
        list.push({ name, count, last });
      }
      list.sort((a, b) => new Date(b.last).getTime() - new Date(a.last).getTime());
      setProjects(list);
    })();
  }, []);

  useInput((input, key) => {
    if (key.downArrow) setIndex(i => Math.min(i + 1, projects.length - 1));
    else if (key.upArrow) setIndex(i => Math.max(i - 1, 0));
    else if (key.return) {
      const sel = projects[index];
      if (sel) onSelect(sel.name);
    } else if (input === 'q') onExit();
  });

  if (projects.length === 0) {
    return React.createElement(Box, { flexDirection: 'column' },
      React.createElement(Text, null, '🚫 No projects found in ~/.dockashell/logs'),
      React.createElement(Text, null, 'Use DockaShell to create a project first.')
    );
  }

  return React.createElement(Box, { flexDirection: 'column' },
    React.createElement(Text, { bold: true }, 'DockaShell TUI - Select Project'),
    ...projects.map((p, i) =>
      React.createElement(Text, { 
        key: p.name, 
        color: i === index ? 'cyan' : undefined 
      }, `${i === index ? '► ' : '  '}${p.name} (${p.count} entries${p.last ? `, last: ${p.last}` : ''})`)
    ),
    React.createElement(Text, { dimColor: true }, '[↑↓] Navigate  [Enter] Select  [q] Quit')
  );
};
