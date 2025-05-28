import { z } from 'zod';
import { validateProjectName, textResponse } from './helpers.js';

export function registerProjectTools(server, projectManager, containerManager) {
  // List projects
  server.tool('list_projects', {}, async () => {
    try {
      const projects = await projectManager.listProjects();
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
      return textResponse(response);
    } catch (error) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  });

  // Start project
  server.tool(
    'start_project',
    { project_name: z.string().describe('Name of the project to start') },
    async ({ project_name }) => {
      validateProjectName(project_name);
      try {
        let projectConfig;
        try {
          projectConfig = await projectManager.loadProject(project_name);
        } catch (loadError) {
          throw new Error(
            `Failed to load project configuration: ${loadError?.message || loadError?.toString() || 'Unknown error'}`
          );
        }
        const result = await containerManager.startContainer(project_name);
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
        return textResponse(response);
      } catch (error) {
        return { ...textResponse(`Error: ${error.message}`), isError: true };
      }
    }
  );

  // Stop project
  server.tool(
    'stop_project',
    { project_name: z.string().describe('Name of the project to stop') },
    async ({ project_name }) => {
      validateProjectName(project_name);
      try {
        const result = await containerManager.stopContainer(project_name);
        let response = `# Project Stopped: ${project_name}\n\n`;
        response += `**Status:** ${result.status}\n`;
        if (result.containerId) {
          response += `**Container ID:** ${result.containerId}\n`;
        }
        return textResponse(response);
      } catch (error) {
        return { ...textResponse(`Error: ${error.message}`), isError: true };
      }
    }
  );

  // Project status
  server.tool(
    'project_status',
    { project_name: z.string().describe('Name of the project to check') },
    async ({ project_name }) => {
      try {
        validateProjectName(project_name);
        const status = await containerManager.getStatus(project_name);
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
        return textResponse(response);
      } catch (error) {
        throw new Error(
          `Failed to get status for project '${project_name}': ${error.message}`
        );
      }
    }
  );
}
