import { z } from 'zod';
import { validateProjectName, textResponse } from './helpers.js';

export function registerExecutionTools(
  server,
  projectManager,
  containerManager,
  securityManager
) {
  // Run command
  server.tool(
    'bash',
    {
      project_name: z.string().describe('Name of the project'),
      command: z.string().describe('Shell command to execute'),
    },
    async ({ project_name, command }) => {
      validateProjectName(project_name);
      if (!command || typeof command !== 'string') {
        throw new Error('Command must be a non-empty string');
      }
      try {
        const projectConfig = await projectManager.loadProject(project_name);
        securityManager.validateCommand(command, projectConfig);
        const maxTime = securityManager.getMaxExecutionTime(projectConfig);
        const result = await containerManager.executeCommand(
          project_name,
          command,
          {
            timeout: maxTime * 1000,
          }
        );
        let response = `# Command Execution: ${project_name}\n\n`;
        response += `**Command:** \`${command}\`\n`;
        response += `**Exit Code:** ${result.exitCode}\n`;
        response += `**Success:** ${result.success ? '✅' : '❌'}\n\n`;
        if (result.stdout && result.stdout.trim()) {
          response += `**Output:**\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
        }
        if (result.stderr && result.stderr.trim()) {
          response += `**Error Output:**\n\`\`\`\n${result.stderr}\n\`\`\`\n\n`;
        }
        if (result.timedOut) {
          response += `**Note:** Command timed out after ${maxTime} seconds\n`;
        }
        return result.success
          ? textResponse(response)
          : { ...textResponse(response), isError: true };
      } catch (error) {
        return { ...textResponse(`Error: ${error.message}`), isError: true };
      }
    },
    {
      description:
        'Executes shell commands in a project container. Avoid interactive commands (vim, nano, less, top) as they require TTY. Use non-interactive alternatives instead.',
    }
  );

  // Apply patch
  server.tool(
    'apply_patch',
    {
      project_name: z.string().describe('Name of the project'),
      patch: z
        .string()
        .describe('Patch in OpenAI format (*** Begin Patch / *** End Patch)'),
    },
    async ({ project_name, patch }) => {
      validateProjectName(project_name);
      if (!patch || typeof patch !== 'string') {
        throw new Error('Patch must be a non-empty string');
      }
      try {
        await projectManager.loadProject(project_name);
        const result = await containerManager.applyPatch(project_name, patch);
        let response = `# Apply Patch: ${project_name}\n\n`;
        response += `**Exit Code:** ${result.exitCode}\n`;
        response += `**Success:** ${result.success ? '✅' : '❌'}\n\n`;
        if (result.stdout) {
          response += `**Output:**\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
        }
        if (result.stderr) {
          response += `**Error Output:**\n\`\`\`\n${result.stderr}\n\`\`\`\n\n`;
        }
        return result.success
          ? textResponse(response)
          : { ...textResponse(response), isError: true };
      } catch (error) {
        return { ...textResponse(`Error: ${error.message}`), isError: true };
      }
    },
    {
      description:
        'Applies code patches using OpenAI format. Patch must start with "*** Begin Patch\\n" and end with "\\n*** End Patch". Use "*** Add File: path", "*** Update File: path", or "*** Delete File: path" followed by diff content with +/- lines.',
    }
  );

  // Write file
  server.tool(
    'write_file',
    {
      project_name: z.string().describe('Name of the project'),
      path: z.string().describe('File path inside container'),
      content: z.string().describe('File contents'),
      overwrite: z.boolean().optional().describe('Overwrite existing file'),
    },
    async ({ project_name, path, content, overwrite = false }) => {
      validateProjectName(project_name);
      if (!path || typeof path !== 'string') {
        throw new Error('Path must be a non-empty string');
      }
      try {
        await projectManager.loadProject(project_name);
        const result = await containerManager.writeFile(
          project_name,
          path,
          content || '',
          overwrite
        );
        let response = `# Write File: ${project_name}\n\n`;
        response += `**Path:** ${path}\n`;
        response += `**Exit Code:** ${result.exitCode}\n`;
        response += `**Success:** ${result.success ? '✅' : '❌'}\n`;
        if (result.stderr) {
          response += `\n**Error Output:**\n\`\`\`\n${result.stderr}\n\`\`\``;
        }
        return result.success
          ? textResponse(response)
          : { ...textResponse(response), isError: true };
      } catch (error) {
        return { ...textResponse(`Error: ${error.message}`), isError: true };
      }
    },
    {
      description:
        'Creates or overwrites files in a project container with the specified content',
    }
  );
}
