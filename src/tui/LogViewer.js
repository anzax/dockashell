import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { readLogEntries } from './read-logs.js';

const formatLines = (text, maxLines) => {
  const lines = (text || '').split('\n');
  if (lines.length > maxLines) {
    return [...lines.slice(0, maxLines), `... [${lines.length - maxLines} more lines]`];
  }
  return lines;
};

const Entry = ({ entry, selected, maxLines }) => {
  let header = '';
  let content = '';
  let icon = '';

  if (entry.kind === 'note') {
    const type = (entry.noteType || '').toUpperCase();
    header = `${entry.timestamp} [${type}]`;
    if (entry.noteType === 'agent') icon = '🧠';
    else if (entry.noteType === 'user') icon = '👤';
    content = entry.text || '';
  } else if (entry.kind === 'command') {
    const exit = entry.result?.exitCode;
    const dur = entry.result?.duration;
    header = `${entry.timestamp} [COMMAND]`;
    icon = '💻';
    content = `${entry.command}\nexit_code=${exit} duration=${dur}`;
  } else {
    header = `${entry.timestamp} [${entry.kind}]`;
    content = JSON.stringify(entry, null, 2);
  }

  const lines = formatLines(content, maxLines);

  return (
    <Box flexDirection="column" paddingLeft={1} borderStyle={selected ? 'round' : undefined} borderColor="cyan">
      <Text>{header} {icon}</Text>
      {lines.map((l, idx) => <Text key={idx}>{l}</Text>)}
    </Box>
  );
};

export const LogViewer = ({ project, onBack, onExit, config }) => {
  const [entries, setEntries] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await readLogEntries(project, config.display.max_entries);
        setEntries(data);
      } catch (err) {
        setEntries([{ kind: 'error', timestamp: '', text: err.message }]);
      }
    })();
  }, [project]);

  useInput((input, key) => {
    if (key.downArrow) setIndex(i => Math.min(i + 1, entries.length - 1));
    else if (key.upArrow) setIndex(i => Math.max(i - 1, 0));
    else if (input === 'b') onBack();
    else if (input === 'q') onExit();
  });

  if (entries.length === 0) {
    return <Text>No entries</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold>{`DockaShell TUI - ${project}`}</Text>
      {entries.map((e, i) => (
        <Entry key={i} entry={e} selected={i === index} maxLines={config.display.max_lines_per_entry} />
      ))}
      <Text dimColor>{'[↑↓] Navigate  [b] Back  [q] Quit'}</Text>
    </Box>
  );
};
