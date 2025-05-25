import { formatMultilineText, truncateText, formatCommandOutput } from './line-formatter.js';

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'No timestamp';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid timestamp';
  // Format as YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Kept for backwards compatibility
export const formatLines = (text, maxLines = Infinity) => {
  if (!text) return [];
  const lines = text.split('\n');
  return [
    ...lines.slice(0, maxLines),
    ...(lines.length > maxLines ? ['...'] : [])
  ];
};

export const getNoteTypeColor = (noteType) => {
  switch (noteType) {
    case 'user':
      return 'blue';
    case 'agent':
      return 'yellow';
    case 'summary':
      return 'magenta';
    default:
      return 'white';
  }
};

export const getNoteTypeIcon = (noteType) => {
  switch (noteType) {
    case 'user':
      return '👤';
    case 'agent':
      return '🤖';
    case 'summary':
      return '📝';
    default:
      return '📋';
  }
};

export const buildEntryLines = (entry, maxLines = Infinity, terminalWidth = 80, options = {}) => {
  const { showOutput = true, compact = false, isDetailView = false } = options;
  const lines = [];

  // Calculate available width for content
  const contentAvailableWidth = Math.max(40, terminalWidth - 10); // Leave some margin

  // Always use 2 lines for list view (compact mode)
  const effectiveMaxLines = compact ? 2 : maxLines;

  if (entry.type === 'note' || entry.kind === 'note') {
    const noteType = entry.noteType || 'note';
    
    // First line: header with timestamp and note type
    lines.push({
      type: 'header',
      icon: getNoteTypeIcon(noteType),
      timestamp: formatTimestamp(entry.timestamp),
      typeText: noteType.toUpperCase(),
      typeColor: getNoteTypeColor(noteType)
    });
    
    // Second line and beyond: content
    if (entry.text) {
      const text = entry.text.trim();
      
      if (compact) {
        // For list view, show first line truncated to available width
        const firstLine = text.split('\n')[0];
        lines.push({ 
          type: 'content', 
          text: truncateText(firstLine, contentAvailableWidth) 
        });
      } else {
        // For detail view, wrap long lines properly
        const formattedLines = formatMultilineText(text, contentAvailableWidth, maxLines - 1);
        formattedLines.forEach((line) => lines.push({ type: 'content', text: line }));
      }
    }
  } else if (entry.kind === 'command' || entry.type === 'command') {
    const result = entry.result || {};
    const exitCode = result.exitCode !== undefined ? result.exitCode : 'N/A';
    const duration = result.duration || 'N/A';
    
    // First line: header with timestamp, command type, exit code, and duration
    lines.push({
      type: 'header',
      icon: '💻',
      timestamp: formatTimestamp(entry.timestamp),
      typeText: `COMMAND | Exit: ${exitCode} | ${duration}`,
      typeColor: 'cyan'
    });

    // Command lines
    const command = entry.command || '';
    
    if (compact) {
      // For list view, intelligently truncate command
      let displayCommand = command;
      
      // Special handling for multi-line commands
      if (command.includes('\n')) {
        const firstLine = command.split('\n')[0];
        const lineCount = command.split('\n').length;
        
        if (firstLine.includes('<<')) {
          // Heredoc command
          displayCommand = firstLine + ` ... (${lineCount} lines)`;
        } else {
          // Other multi-line command
          displayCommand = firstLine + ` ... (+${lineCount - 1} lines)`;
        }
      }
      
      // Truncate to available width
      const prefixWidth = 2; // "$ "
      const truncated = truncateText(displayCommand, contentAvailableWidth - prefixWidth);
      lines.push({ type: 'command', text: `$ ${truncated}` });
    } else {
      // For detail view, show full command with proper formatting
      const commandLines = command.split('\n');
      
      if (commandLines.length === 1) {
        // Single line command - wrap if too long
        if (command.length > contentAvailableWidth - 2) {
          const wrapped = formatMultilineText(command, contentAvailableWidth - 2, Infinity, false);
          wrapped.forEach((line, index) => {
            lines.push({ 
              type: 'command', 
              text: index === 0 ? `$ ${line}` : `  ${line}`
            });
          });
        } else {
          lines.push({ type: 'command', text: `$ ${command}` });
        }
      } else {
        // Multi-line command
        commandLines.forEach((line, index) => {
          if (index === 0) {
            lines.push({ type: 'command', text: `$ ${line}` });
          } else {
            lines.push({ type: 'command', text: `  ${line}` });
          }
        });
      }
      
      // Add separator before output if we have output
      if (showOutput && result.output && result.output.trim()) {
        lines.push({ 
          type: 'separator', 
          text: '─'.repeat(Math.min(contentAvailableWidth, 60)) 
        });
        
        // Format output with proper line handling
        const outputLines = formatCommandOutput(result.output.trim(), contentAvailableWidth, maxLines - lines.length);
        outputLines.forEach((line) => lines.push({ type: 'output', text: line }));
      }
    }
  } else {
    // Unknown entry type
    const type = entry.type || entry.kind || 'UNKNOWN';
    lines.push({
      type: 'header',
      icon: '❓',
      timestamp: formatTimestamp(entry.timestamp),
      typeText: type.toUpperCase(),
      typeColor: 'gray'
    });
    
    const json = JSON.stringify(entry, null, 2);
    if (compact) {
      // For list view, show truncated JSON
      const firstLine = json.split('\n')[0];
      lines.push({ 
        type: 'content', 
        text: truncateText(firstLine, contentAvailableWidth) 
      });
    } else {
      // For detail view, show formatted JSON
      const jsonLines = formatMultilineText(json, contentAvailableWidth, maxLines - 1);
      jsonLines.forEach((line) => lines.push({ type: 'content', text: line }));
    }
  }

  return lines;
};

export const prepareEntry = (entry, maxLines, terminalWidth = 80) => {
  // List view: always 2 lines, compact mode
  const lines = buildEntryLines(entry, 2, terminalWidth, { showOutput: false, compact: true });
  
  // Detail view: full content with output
  const fullLines = buildEntryLines(entry, Infinity, terminalWidth, { showOutput: true, compact: false, isDetailView: true });
  
  // Height is always 3 for list view (2 lines + 1 margin)
  const height = 3;
  
  return { entry, lines, fullLines, height };
};
