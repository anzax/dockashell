export function parseTraceLine(line) {
  try {
    const trace = typeof line === 'string' ? JSON.parse(line) : line;
    if (trace.tool === 'run_command') {
      return {
        timestamp: trace.timestamp,
        kind: 'command',
        command: trace.command,
        result: trace.result,
      };
    }
    if (trace.tool === 'apply_patch') {
      return {
        timestamp: trace.timestamp,
        kind: 'apply_patch',
        diff: trace.patch,
        result: trace.result,
      };
    }
    if (trace.tool === 'write_file') {
      return {
        timestamp: trace.timestamp,
        kind: 'write_file',
        path: trace.path,
        content: trace.content,
        overwrite: trace.overwrite,
        contentLength: trace.contentLength,
        result: trace.result,
      };
    }
    if (trace.tool === 'write_trace') {
      return {
        timestamp: trace.timestamp,
        kind: 'note',
        noteType: trace.type,
        text: trace.text,
      };
    }
    return { timestamp: trace.timestamp, ...trace };
  } catch {
    return null;
  }
}

export function parseTraceLines(lines) {
  return lines.map(parseTraceLine).filter(Boolean);
}

