export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, { hour12: false });
};

export const formatLines = (text, maxLines = Infinity) => {
  if (!text) return [];
  const lines = text.split('\n');
  if (!isFinite(maxLines) || lines.length <= maxLines) return lines;
  const half = Math.floor((maxLines - 1) / 2);
  const start = lines.slice(0, half);
  const end = lines.slice(-(maxLines - 1 - half));
  return [
    ...start,
    `... (${lines.length - maxLines + 1} lines truncated) ...`,
    ...end
  ];
};

export const getNoteTypeColor = (noteType) => {
  switch (noteType) {
    case 'user':
      return 'blue';
    case 'agent':
      return 'green';
    case 'summary':
      return 'yellow';
    default:
      return 'white';
  }
};

export const getNoteTypeIcon = (noteType) => {
  switch (noteType) {
    case 'user':
      return '👤';
    case 'agent':
      return '🧠';
    case 'summary':
      return '📋';
    default:
      return '📝';
  }
};

export const buildEntryLines = (entry, maxLines = Infinity) => {
  const lines = [];

  if (entry.type === 'note' || entry.kind === 'note') {
    const noteType = entry.noteType || 'note';
    lines.push({
      type: 'header',
      icon: getNoteTypeIcon(noteType),
      timestamp: formatTimestamp(entry.timestamp),
      typeText: noteType.toUpperCase(),
      typeColor: getNoteTypeColor(noteType)
    });
    const contentLines = formatLines(entry.text || '', maxLines);
    contentLines.forEach((t) => lines.push({ type: 'content', text: t }));
  } else if (entry.kind === 'command') {
    lines.push({
      type: 'header',
      icon: '💻',
      timestamp: formatTimestamp(entry.timestamp),
      typeText: 'COMMAND',
      typeColor: 'cyan'
    });
    lines.push({ type: 'command', text: `$ ${entry.command}` });
    const result = entry.result || {};
    const exitCode = result.exitCode !== undefined ? result.exitCode : 'N/A';
    const duration = result.duration;
    const success = exitCode === 0;
    lines.push({
      type: 'status',
      text: `Exit: ${exitCode}`,
      color: success ? 'green' : 'red',
      extra: ` | Duration: ${duration}`
    });
    const output = result.output || '';
    if (output.trim()) {
      const outputLines = formatLines(output.trim(), maxLines);
      outputLines.forEach((t) => lines.push({ type: 'output', text: t }));
    }
  } else {
    const type = entry.type || entry.kind || 'UNKNOWN';
    lines.push({
      type: 'header',
      icon: '❓',
      timestamp: formatTimestamp(entry.timestamp),
      typeText: type.toUpperCase(),
      typeColor: 'gray'
    });
    const contentLines = formatLines(JSON.stringify(entry, null, 2), maxLines);
    contentLines.forEach((t) => lines.push({ type: 'content', text: t }));
  }

  return lines;
};

export const prepareEntry = (entry, maxLines) => {
  const lines = buildEntryLines(entry, maxLines);
  const fullLines = buildEntryLines(entry, Infinity);
  const height = lines.length + 1; // margin bottom
  return { entry, lines, fullLines, height };
};
