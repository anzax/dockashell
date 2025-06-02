import fs from 'fs-extra';
import path from 'path';
import ProjectManager from '../../core/project-manager.js';
import ContainerManager from '../../core/container-manager.js';
import { success, error as errorColor, warn } from '../utils/output.js';
import { createDefaultConfig } from '../utils/project-utils.js';
import { checkDockerDaemon } from '../utils/docker-utils.js';

export function registerProjectCommands(program) {
  program
    .command('start <project>')
    .description('Start project container')
    .action(async (project) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(errorColor('Docker daemon not running'));
        process.exit(1);
      }

      const pm = new ProjectManager();
      await pm.initialize();
      const cm = new ContainerManager(pm);
      try {
        pm.validateProjectName(project);
        const result = await cm.startContainer(project);
        console.log(success(`Started: ${result.containerId}`));
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });

  program
    .command('stop <project>')
    .description('Stop project container')
    .action(async (project) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(errorColor('Docker daemon not running'));
        process.exit(1);
      }

      const pm = new ProjectManager();
      await pm.initialize();
      const cm = new ContainerManager(pm);
      try {
        pm.validateProjectName(project);
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
        pm.validateProjectName(project);
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
    .command('recreate <project>')
    .description('Recreate project container')
    .action(async (project) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(errorColor('Docker daemon not running'));
        process.exit(1);
      }

      const pm = new ProjectManager();
      await pm.initialize();
      const cm = new ContainerManager(pm);
      try {
        pm.validateProjectName(project);
        await cm.stopContainer(project);
        try {
          const container = cm.docker.getContainer(`dockashell-${project}`);
          await container.remove({ force: true });
        } catch {
          /* ignore */
        }
        await cm.startContainer(project);
        console.log(success('Recreated container'));
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
