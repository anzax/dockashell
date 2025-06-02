import { ImageBuilder } from '../utils/image-builder.js';
import { success, error as errorColor } from '../utils/output.js';
import { checkDockerDaemon } from '../utils/docker-utils.js';

export function registerBuild(program) {
  program
    .command('build')
    .description('Build default Docker image')
    .option('-f, --force', 'Force rebuild (ignore existing image)')
    .option('-q, --quiet', 'Minimal output during build')
    .action(async (options) => {
      const docker = await checkDockerDaemon();
      if (!docker.running) {
        console.error(errorColor('Docker daemon not running'));
        process.exit(1);
      }

      const builder = new ImageBuilder();
      try {
        if (options.force) {
          await builder.removeImage();
        }
        const origWrite = process.stdout.write;
        if (options.quiet) {
          process.stdout.write = () => true;
        }
        const ok = await builder.buildDefaultImage();
        if (options.quiet) process.stdout.write = origWrite;
        if (ok) console.log(success('Image build complete'));
        else console.log(errorColor('Image build failed'));
      } catch (err) {
        console.error(errorColor(`Error: ${err.message}`));
        process.exit(1);
      }
    });
}
