#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ProjectManager } from './project-manager.js';
import { ContainerManager } from './container-manager.js';
import { SecurityManager } from './security.js';
import { Logger } from './logger.js';

class DockashellServer {
  constructor() {
    this.server = new McpServer({
      name: 'dockashell',
      version: '0.1.0',
    });

    this.projectManager = new ProjectManager();
    this.logger = new Logger();
    this.containerManager = new ContainerManager(this.projectManager);
    this.securityManager = new SecurityManager();
    this.transport = null;
  }

  async initialize() {
    await this.projectManager.initialize();
    this.setupTools();
    this.setupCleanupHandlers();
  }

  setupTools() {
    // List projects tool
    this.server.tool('list_projects', {}, async () => {
      try {
        const projects = await this.projectManager.listProjects();

        let response = '# Configured Projects\n\n';

        if (projects.length === 0) {
          response +=
            'No projects configured. Create project configs in `~/.dockashell/projects/`\n';
        } else {
          projects.forEach((project) => {
            response += `**${project.name}**\n`;
            response += `- Description: ${project.description || 'None'}\n`;
            response += `- Image: ${project.image}\n`;
            response += `- Status: ${project.status}\n\n`;
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: response,
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to list projects: ${error.message}`);
      }
    });

    // Start project tool
    this.server.tool(
      'start_project',
      {
        project_name: z.string().describe('Name of the project to start'),
      },
      async ({ project_name }) => {
        try {
          if (!project_name || typeof project_name !== 'string') {
            throw new Error('Project name must be a non-empty string');
          }

          // Load project configuration
          let projectConfig;
          try {
            projectConfig = await this.projectManager.loadProject(project_name);
          } catch (loadError) {
            throw new Error(
              `Failed to load project configuration: ${loadError?.message || loadError?.toString() || 'Unknown error'}`
            );
          }

          const result =
            await this.containerManager.startContainer(project_name);

          let response = `# Project Started: ${project_name}\n\n`;
          response += `**Container ID:** ${result.containerId}\n`;
          response += `**Status:** ${result.status}\n`;
          response += `**Image:** ${projectConfig.image}\n`;

          if (result.ports && result.ports.length > 0) {
            response += `**Port Mappings:**\n`;
            result.ports.forEach((port) => {
              response += `- http://localhost:${port.host} → ${port.container}\n`;
            });
          }

          if (projectConfig.mounts && projectConfig.mounts.length > 0) {
            response += `**Mounts:**\n`;
            projectConfig.mounts.forEach((mount) => {
              response += `- ${mount.host} → ${mount.container}\n`;
            });
          }

          return {
            content: [
              {
                type: 'text',
                text: response,
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to start project '${project_name}': ${error.message}`
          );
        }
      }
    );

    // Run command tool
    this.server.tool(
      'run_command',
      {
        project_name: z.string().describe('Name of the project'),
        command: z.string().describe('Shell command to execute'),
      },
      async ({ project_name, command }) => {
        try {
          if (!project_name || typeof project_name !== 'string') {
            throw new Error('Project name must be a non-empty string');
          }

          if (!command || typeof command !== 'string') {
            throw new Error('Command must be a non-empty string');
          }

          const projectConfig =
            await this.projectManager.loadProject(project_name);

          // Validate command security
          this.securityManager.validateCommand(command, projectConfig);

          const maxTime =
            this.securityManager.getMaxExecutionTime(projectConfig);
          const result = await this.containerManager.executeCommand(
            project_name,
            command,
            { timeout: maxTime * 1000 }
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

          return {
            content: [
              {
                type: 'text',
                text: response,
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to execute command in project '${project_name}': ${error.message}`
          );
        }
      }
    );

    // Patch apply tool using OpenAI format
    this.server.tool(
      'apply_patch',
      {
        project_name: z.string().describe('Name of the project'),
        patch: z
          .string()
          .describe('Patch in OpenAI format (*** Begin Patch / *** End Patch)'),
      },
      async ({ project_name, patch }) => {
        try {
          if (!project_name || typeof project_name !== 'string') {
            throw new Error('Project name must be a non-empty string');
          }

          if (!patch || typeof patch !== 'string') {
            throw new Error('Patch must be a non-empty string');
          }

          // Ensure project exists
          await this.projectManager.loadProject(project_name);

          const result = await this.containerManager.applyPatch(
            project_name,
            patch
          );

          let response = `# Apply Patch: ${project_name}\n\n`;
          response += `**Exit Code:** ${result.exitCode}\n`;
          response += `**Success:** ${result.success ? '✅' : '❌'}\n\n`;

          if (result.stdout) {
            response += `**Output:**\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
          }

          if (result.stderr) {
            response += `**Error Output:**\n\`\`\`\n${result.stderr}\n\`\`\`\n\n`;
          }

          return { content: [{ type: 'text', text: response }] };
        } catch (error) {
          throw new Error(
            `Failed to apply patch in project '${project_name}': ${error.message}`
          );
        }
      }
    );

    // Write file tool
    this.server.tool(
      'write_file',
      {
        project_name: z.string().describe('Name of the project'),
        path: z.string().describe('File path inside container'),
        content: z.string().describe('File contents'),
        overwrite: z.boolean().optional().describe('Overwrite existing file'),
      },
      async ({ project_name, path, content, overwrite = false }) => {
        try {
          if (!project_name || typeof project_name !== 'string') {
            throw new Error('Project name must be a non-empty string');
          }
          if (!path || typeof path !== 'string') {
            throw new Error('Path must be a non-empty string');
          }

          await this.projectManager.loadProject(project_name);
          const result = await this.containerManager.writeFile(
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

          return { content: [{ type: 'text', text: response }] };
        } catch (error) {
          throw new Error(
            `Failed to write file in project '${project_name}': ${error.message}`
          );
        }
      }
    );

    // Write trace note tool
    this.server.tool(
      'write_trace',
      {
        project_name: z.string().describe('Project name'),
        type: z.enum(['user', 'summary', 'agent']).describe('Note type'),
        text: z.string().describe('Text to record'),
      },
      async ({ project_name, type, text }) => {
        try {
          await this.logger.logNote(project_name, type, text);
          return { content: [{ type: 'text', text: 'Trace recorded' }] };
        } catch (error) {
          throw new Error(`Failed to write trace: ${error.message}`);
        }
      }
    );

    // Read traces tool
    this.server.tool(
      'read_traces',
      {
        project_name: z.string().describe('Project name'),
        type: z
          .string()
          .optional()
          .describe("Filter by 'command', 'note', 'user', 'agent', 'summary'"),
        search: z.string().optional().describe('Search substring'),
        skip: z.number().int().optional().describe('Skip N entries'),
        limit: z.number().int().optional().describe('Limit number of entries'),
        fields: z
          .array(z.string())
          .optional()
          .describe(
            'Fields to include: timestamp, type, content (always shown), exit_code, duration, output (preview)'
          ),
      },
      async ({ project_name, type, search, skip = 0, limit = 20, fields }) => {
        try {
          const entries = await this.logger.readTraces(project_name, {
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
                      : (
                          entry.noteType ||
                          entry.kind ||
                          'UNKNOWN'
                        ).toUpperCase();

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
                  lines.push(entry.diff);
                } else if (entry.kind === 'write_file') {
                  lines.push(entry.path);
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
                const displayOutput =
                  entry.result?.output.length > 200
                    ? entry.result?.output.substring(0, 200) + '...'
                    : entry.result?.output;
                lines.push(displayOutput);
                lines.push('```');
              }

              return lines.join('\n');
            })
            .join('\n\n');

          return {
            content: [{ type: 'text', text: text || 'No trace entries found' }],
          };
        } catch (error) {
          throw new Error(`Failed to read traces: ${error.message}`);
        }
      }
    );

    // Stop project tool
    this.server.tool(
      'stop_project',
      {
        project_name: z.string().describe('Name of the project to stop'),
      },
      async ({ project_name }) => {
        try {
          if (!project_name || typeof project_name !== 'string') {
            throw new Error('Project name must be a non-empty string');
          }

          const result =
            await this.containerManager.stopContainer(project_name);

          let response = `# Project Stopped: ${project_name}\n\n`;
          response += `**Status:** ${result.status}\n`;

          if (result.containerId) {
            response += `**Container ID:** ${result.containerId}\n`;
          }

          return {
            content: [
              {
                type: 'text',
                text: response,
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to stop project '${project_name}': ${error.message}`
          );
        }
      }
    );

    // Project status tool
    this.server.tool(
      'project_status',
      {
        project_name: z.string().describe('Name of the project to check'),
      },
      async ({ project_name }) => {
        try {
          if (!project_name || typeof project_name !== 'string') {
            throw new Error('Project name must be a non-empty string');
          }

          const status = await this.containerManager.getStatus(project_name);

          let response = `# Project Status: ${project_name}\n\n`;

          if (status.status === 'not_found') {
            response += '**Status:** Container not found (not started)\n';
          } else {
            response += `**Container ID:** ${status.containerId}\n`;
            response += `**Status:** ${status.status}\n`;
            response += `**Image:** ${status.image}\n`;
            response += `**Created:** ${status.created}\n`;

            if (status.ports && status.ports.length > 0) {
              response += `**Port Mappings:**\n`;
              status.ports.forEach((port) => {
                response += `- http://localhost:${port.host} → ${port.container}\n`;
              });
            }

            if (status.mounts && status.mounts.length > 0) {
              response += `**Mounts:**\n`;
              status.mounts.forEach((mount) => {
                response += `- ${mount.source} → ${mount.destination} (${mount.mode})\n`;
              });
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: response,
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to get status for project '${project_name}': ${error.message}`
          );
        }
      }
    );
  }

  async cleanup() {
    try {
      await this.server.close();
    } catch {
      // Ignore errors during close
    }
    await this.containerManager.cleanup();
    await this.logger.cleanup();
  }

  setupCleanupHandlers() {
    const exitHandler = async () => {
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);
    process.on('SIGQUIT', exitHandler);
    process.stdin.on('end', exitHandler);
    process.stdin.on('close', exitHandler);
  }

  async run() {
    await this.initialize();

    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);

    // console.log("DockaShell MCP server started");
  }
}

// Export the class for testing
export { DockashellServer };

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new DockashellServer();
  server.run().catch(console.error);
}
