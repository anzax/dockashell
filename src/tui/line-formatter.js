/**
 * Line formatting utilities for consistent text rendering
 */

/**
 * Wrap text to fit within a specified width
 * @param {string} text - Text to wrap
 * @param {number} width - Maximum width per line
 * @param {string} prefix - Prefix for continuation lines (e.g., '  ')
 * @returns {string[]} Array of wrapped lines
 */
export const wrapText = (text, width, prefix = '') => {
  if (!text || width <= 0) return [];
  
  const lines = [];
  const words = text.split(/\s+/);
  let currentLine = '';
  
  for (const word of words) {
    // Handle words longer than width
    if (word.length > width) {
      // Flush current line if not empty
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      
      // Break long word into chunks
      let lastChunk = '';
      for (let i = 0; i < word.length; i += width) {
        const chunk = word.slice(i, Math.min(i + width, word.length));
        const fullLine = (lines.length > 0 ? prefix : '') + chunk;
        lines.push(fullLine);
        lastChunk = chunk;
      }
      
      // If the last chunk leaves room for more text, set it as currentLine
      const lastLineLength = (lines.length > 0 ? prefix.length : 0) + lastChunk.length;
      if (lastLineLength < width) {
        currentLine = lines.pop(); // Remove last line and continue with it
      }
      
      continue;
    }
    
    // Check if adding word exceeds width
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (testLine.length > width) {
      // Start new line
      lines.push(currentLine);
      currentLine = prefix + word;
    } else {
      currentLine = testLine;
    }
  }
  
  // Add remaining content
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [''];
};

/**
 * Format multiline text with proper width constraints
 * @param {string} text - Text to format
 * @param {number} width - Maximum width per line
 * @param {number} maxLines - Maximum number of lines (Infinity for no limit)
 * @param {boolean} preserveLineBreaks - Whether to preserve original line breaks
 * @returns {string[]} Formatted lines
 */
export const formatMultilineText = (text, width, maxLines = Infinity, preserveLineBreaks = true) => {
  if (!text) return [];
  
  const lines = [];
  const inputLines = preserveLineBreaks ? text.split('\n') : [text.replace(/\n/g, ' ')];
  
  for (const line of inputLines) {
    if (lines.length >= maxLines) break;
    
    // Handle empty lines
    if (!line.trim()) {
      lines.push('');
      continue;
    }
    
    // Wrap long lines
    if (line.length > width) {
      const wrapped = wrapText(line, width);
      const remaining = maxLines - lines.length;
      lines.push(...wrapped.slice(0, remaining));
    } else {
      lines.push(line);
    }
  }
  
  // Add truncation indicator if needed
  if (lines.length === maxLines && lines.length < inputLines.length) {
    const lastLine = lines[lines.length - 1];
    if (lastLine.length > width - 3) {
      lines[lines.length - 1] = lastLine.substring(0, width - 3) + '...';
    } else {
      lines[lines.length - 1] = lastLine + '...';
    }
  }
  
  return lines;
};

/**
 * Truncate text to fit within width, adding ellipsis if needed
 * @param {string} text - Text to truncate
 * @param {number} width - Maximum width
 * @returns {string} Truncated text
 */
export const truncateText = (text, width) => {
  if (!text) return '';
  if (width <= 3) return '...';
  if (text.length < width) return text;
  
  // Ensure we have room for ellipsis
  return text.substring(0, Math.max(0, width - 3)) + '...';
};

/**
 * Format command output with proper line handling
 * @param {string} output - Command output text
 * @param {number} width - Maximum width per line
 * @param {number} maxLines - Maximum lines to show
 * @returns {string[]} Formatted output lines
 */
export const formatCommandOutput = (output, width, maxLines = Infinity) => {
  if (!output || !output.trim()) return [];
  
  // Split by line breaks and format each line
  const lines = output.split('\n');
  const formatted = [];
  
  for (const line of lines) {
    if (formatted.length >= maxLines) break;
    
    // Preserve empty lines in output
    if (!line) {
      formatted.push('');
      continue;
    }
    
    // For very long lines, wrap them
    if (line.length > width) {
      const wrapped = wrapText(line, width, '  ');
      const remaining = maxLines - formatted.length;
      formatted.push(...wrapped.slice(0, remaining));
    } else {
      formatted.push(line);
    }
  }
  
  return formatted;
};
