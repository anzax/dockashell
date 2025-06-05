import fs from 'fs-extra';
import path from 'path';
import ProjectManager from '../../core/project-manager.js';
import ContainerManager from '../../core/container-manager.js';
import { success, error as errorColor, warn } from '../utils/output.js';
import { createDefaultConfig } from '../utils/project-utils.js';
import { checkDockerDaemon } from '../utils/docker-utils.js';
import { confirm } from '../utils/prompts.js';
import { validateProjectNameWithSuggestions } from '../utils/validation.js';

export function registerProjectCommands(program) {
  program
    .command('start <project>')
    .description('Start project container')
    .action(async (project) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(
          errorColor(
            "Docker daemon not running. Please start Docker Desktop or run 'sudo systemctl start docker'"
          )
        );
        process.exit(1);
      }

      const pm = new ProjectManager();
      await pm.initialize();
      const cm = new ContainerManager(pm);
      try {
        const validation = validateProjectNameWithSuggestions(project);
        if (!validation.valid) {
          console.error(errorColor(`Error: ${validation.error}`));
          if (validation.suggestions.length > 0) {
            console.error(warn('Suggestions:'));
            validation.suggestions.forEach((s) =>
              console.error(warn(`  ${s}`))
            );
          }
          process.exit(1);
        }
        const result = await cm.startContainer(project);
        console.log(success(`Started: ${result.containerId}`));
      } catch (err) {
        if (err.message && err.message.includes('port already in use')) {
          console.error(errorColor(`Error: ${err.message}`));
          console.error(
            warn("Hint: Check what's running on that port with: lsof -i :PORT")
          );
        } else {
          console.error(errorColor(`Error: ${err.message}`));
        }
        process.exit(1);
      }
    });

  program
    .command('stop <project>')
    .description('Stop project container')
    .action(async (project) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(
          errorColor(
            "Docker daemon not running. Please start Docker Desktop or run 'sudo systemctl start docker'"
          )
        );
        process.exit(1);
      }

      const pm = new ProjectManager();
      await pm.initialize();
      const cm = new ContainerManager(pm);
      try {
        const validation = validateProjectNameWithSuggestions(project);
        if (!validation.valid) {
          console.error(errorColor(`Error: ${validation.error}`));
          if (validation.suggestions.length > 0) {
            console.error(warn('Suggestions:'));
            validation.suggestions.forEach((s) =>
              console.error(warn(`  ${s}`))
            );
          }
          process.exit(1);
        }
        await cm.stopContainer(project);
        console.log(success('Stopped'));
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });

  program
    .command('create <project>')
    .description('Create new project')
    .action(async (project) => {
      const pm = new ProjectManager();
      await pm.initialize();
      try {
        const validation = validateProjectNameWithSuggestions(project);
        if (!validation.valid) {
          console.error(errorColor(`Error: ${validation.error}`));
          if (validation.suggestions.length > 0) {
            console.error(warn('Suggestions:'));
            validation.suggestions.forEach((s) =>
              console.error(warn(`  ${s}`))
            );
          }
          process.exit(1);
        }
        const projectDir = path.join(pm.projectsDir, project);
        if (await fs.pathExists(projectDir)) {
          console.log(warn('Project already exists'));
          return;
        }
        const config = await createDefaultConfig(project);
        await fs.ensureDir(projectDir);
        await fs.writeJSON(path.join(projectDir, 'config.json'), config, {
          spaces: 2,
        });
        console.log(success(`Created project at ${projectDir}`));
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });

  program
    .command('rebuild <project>')
    .description(
      'Rebuild project container to apply config changes (volume mappings, ports, etc.)'
    )
    .action(async (project) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(
          errorColor(
            "Docker daemon not running. Please start Docker Desktop or run 'sudo systemctl start docker'"
          )
        );
        process.exit(1);
      }

      const pm = new ProjectManager();
      await pm.initialize();
      const cm = new ContainerManager(pm);
      try {
        const validation = validateProjectNameWithSuggestions(project);
        if (!validation.valid) {
          console.error(errorColor(`Error: ${validation.error}`));
          if (validation.suggestions.length > 0) {
            console.error(warn('Suggestions:'));
            validation.suggestions.forEach((s) =>
              console.error(warn(`  ${s}`))
            );
          }
          process.exit(1);
        }
        const confirmed = await confirm(
          `This will destroy the current container for '${project}' and rebuild it with current config.`
        );
        if (!confirmed) {
          console.log('Operation cancelled');
          return;
        }
        await cm.stopContainer(project);
        try {
          const container = cm.docker.getContainer(`dockashell-${project}`);
          await container.remove({ force: true });
        } catch {
          /* ignore */
        }
        await cm.startContainer(project);
        console.log(success('Rebuilt container'));
      } catch (err) {
        if (err.message && err.message.includes('port already in use')) {
          console.error(errorColor(`Error: ${err.message}`));
          console.error(
            warn("Hint: Check what's running on that port with: lsof -i :PORT")
          );
        } else {
          console.error(errorColor(`Error: ${err.message}`));
        }
        process.exit(1);
      }
    });
}
