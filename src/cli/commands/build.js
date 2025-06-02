import { ImageBuilder } from '../utils/image-builder.js';
import { success, error as errorColor } from '../utils/output.js';
import { checkDockerDaemon } from '../utils/docker-utils.js';
import { confirm } from '../utils/prompts.js';

export function registerBuild(program) {
  program
    .command('build')
    .description('Build default Docker image')
    .option('-f, --force', 'Force rebuild (ignore existing image)')
    .action(async (options) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(
          errorColor(
            "Docker daemon not running. Please start Docker Desktop or run 'sudo systemctl start docker'"
          )
        );
        process.exit(1);
      }

      const builder = new ImageBuilder();
      try {
        if (options.force) {
          const confirmed = await confirm(
            'This will remove the existing image and rebuild from scratch.'
          );
          if (!confirmed) {
            console.log('Build cancelled');
            return;
          }
          await builder.removeImage();
        }
        const ok = await builder.buildDefaultImage();
        if (ok) console.log(success('Image build complete'));
        else console.log(errorColor('Image build failed'));
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
