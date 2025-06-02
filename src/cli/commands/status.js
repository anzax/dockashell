import { checkDockerDaemon, checkImageExists } from '../utils/docker-utils.js';
import { getProjectsStatus } from '../utils/project-utils.js';
import ProjectManager from '../../core/project-manager.js';
import { success, error as errorColor, warn, bold } from '../utils/output.js';

export function registerStatus(program) {
  program
    .command('status')
    .description('Show system and project status')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const projectManager = new ProjectManager();
      await projectManager.initialize();

      const docker = await checkDockerDaemon();
      const image = await checkImageExists('dockashell/default-dev:latest');
      const projects = await getProjectsStatus(projectManager);

      if (options.json) {
        console.log(JSON.stringify({ docker, image, projects }, null, 2));
        return;
      }

      if (docker.running) {
        console.log(`${success('✓')} Docker running (${docker.version})`);
      } else {
        console.log(
          `${errorColor('✖ Docker not available')} - ${docker.error}`
        );
      }

      if (image.exists) {
        console.log(
          `${success('✓')} Default image built (created ${image.created})`
        );
      } else {
        console.log(warn('⚠ Default image missing'));
      }

      if (projects.length === 0) {
        console.log(warn('No projects configured'));
      } else {
        console.log(bold('\nProjects'));
        projects.forEach((p) => {
          const stateColor =
            p.state === 'running'
              ? success(p.state)
              : p.state === 'stopped'
                ? warn(p.state)
                : errorColor(p.state);
          console.log(`- ${p.name} [${stateColor}]`);
        });
      }
    });
}
