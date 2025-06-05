import { z } from 'zod';
import { textResponse } from './helpers.js';

export function registerLogTools(server, logger) {
  // Write trace note
  server.tool(
    'write_trace',
    'Records trace entries for auditing agent actions and preserving session context',
    {
      project_name: z.string().describe('Project name'),
      type: z.enum(['user', 'summary', 'agent']).describe('Note type'),
      text: z.string().describe('Text to record'),
    },
    async ({ project_name, type, text }) => {
      try {
        await logger.logNote(project_name, type, text);
        return textResponse('Trace recorded');
      } catch (error) {
        throw new Error(`Failed to write trace: ${error.message}`);
      }
    }
  );

  // Read traces
  server.tool(
    'read_traces',
    'Retrieves and filters trace history for a project, showing command executions, file operations, and notes with timestamps',
    {
      project_name: z.string().describe('Project name'),
      type: z
        .string()
        .optional()
        .describe(
          "Filter by 'command', 'apply_patch', 'write_file', 'note', 'user', 'agent', 'summary'"
        ),
      search: z.string().optional().describe('Search substring'),
      skip: z.number().int().optional().describe('Skip N entries'),
      limit: z.number().int().optional().describe('Limit number of entries'),
      fields: z
        .array(z.string())
        .optional()
        .describe(
          'Fields to include: timestamp, type, content (always shown), exit_code, duration, output (preview)'
        ),
      output_max_len: z
        .number()
        .int()
        .optional()
        .describe('Preview output length (default 1000 characters)'),
    },
    async ({
      project_name,
      type,
      search,
      skip = 0,
      limit = 20,
      fields,
      output_max_len,
    }) => {
      try {
        const entries = await logger.readTraces(project_name, {
          type,
          search,
          skip,
          limit,
        });
        const validFields = [
          'timestamp',
          'type',
          'content',
          'exit_code',
          'duration',
          'output',
        ];
        const selected = Array.isArray(fields)
          ? fields.filter((f) => validFields.includes(f))
          : ['timestamp', 'type', 'content'];
        if (!selected.includes('timestamp')) selected.unshift('timestamp');
        if (!selected.includes('type')) selected.splice(1, 0, 'type');
        const previewLen =
          typeof output_max_len === 'number' && output_max_len > 0
            ? output_max_len
            : 1000;
        const text = entries
          .map((entry) => {
            const meta = [];
            const typeLabel =
              entry.kind === 'command'
                ? 'COMMAND'
                : entry.kind === 'apply_patch'
                  ? 'APPLY_PATCH'
                  : entry.kind === 'write_file'
                    ? 'WRITE_FILE'
                    : (entry.noteType || entry.kind || 'UNKNOWN').toUpperCase();
            if (
              selected.includes('exit_code') &&
              (entry.kind === 'command' ||
                entry.kind === 'apply_patch' ||
                entry.kind === 'write_file') &&
              entry.result?.exitCode !== undefined
            ) {
              meta.push(`exit_code=${entry.result.exitCode}`);
            }
            if (
              selected.includes('duration') &&
              (entry.kind === 'command' ||
                entry.kind === 'apply_patch' ||
                entry.kind === 'write_file') &&
              entry.result?.duration
            ) {
              meta.push(`duration=${entry.result.duration}`);
            }
            if (
              selected.includes('output') &&
              (entry.kind === 'command' ||
                entry.kind === 'apply_patch' ||
                entry.kind === 'write_file') &&
              entry.result?.output
            ) {
              meta.push(`output_chars=${entry.result.output.length}`);
            }
            let header = `## ${entry.timestamp} [${typeLabel}]`;
            if (meta.length) header += ' ' + meta.join(' ');
            const lines = [header];
            if (selected.includes('content')) {
              if (entry.kind === 'command') {
                if (selected.includes('output')) {
                  lines.push('```bash');
                  lines.push(entry.command);
                  lines.push('```');
                } else {
                  lines.push(entry.command);
                }
              } else if (entry.kind === 'apply_patch') {
                lines.push(entry.patch);
              } else if (entry.kind === 'write_file') {
                const pathText = entry.path || '';
                const overwriteText = entry.overwrite ? ' (overwrite)' : '';
                const sizeText =
                  entry.contentLength !== undefined
                    ? ` [${entry.contentLength} bytes]`
                    : '';
                lines.push(`${pathText}${overwriteText}${sizeText}`);
                if (entry.content) {
                  lines.push('');
                  lines.push('**Content:**');
                  lines.push('```');
                  lines.push(entry.content);
                  lines.push('```');
                }
              } else {
                lines.push(entry.text);
              }
            }
            if (
              selected.includes('output') &&
              (entry.kind === 'command' ||
                entry.kind === 'apply_patch' ||
                entry.kind === 'write_file') &&
              entry.result?.output
            ) {
              lines.push('');
              lines.push('**Output:**');
              lines.push('```');
              lines.push(entry.result.output.slice(0, previewLen));
              lines.push('```');
            }
            return lines.join('\n');
          })
          .join('\n\n');
        return textResponse(text || 'No trace entries found');
      } catch (error) {
        throw new Error(`Failed to read traces: ${error.message}`);
      }
    }
  );
}
