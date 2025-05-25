#!/usr/bin/env node

import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';

export class ImageBuilder {
  constructor() {
    this.docker = new Docker();
    this.imageName = 'dockashell/default-dev';
    this.imageTag = 'latest';
  }

  async buildDefaultImage() {
    try {
      console.log('🔨 Building DockaShell default development image...');

      const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
      if (!(await fs.pathExists(dockerfilePath))) {
        throw new Error('Dockerfile not found in current directory');
      }

      // Create build context from current directory
      const buildContext = process.cwd();

      const stream = await this.docker.buildImage(
        {
          context: buildContext,
          src: ['Dockerfile', '.'],
        },
        {
          t: `${this.imageName}:${this.imageTag}`,
        }
      );

      // Stream build output
      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(
          stream,
          (err, res) => {
            if (err) reject(err);
            else resolve(res);
          },
          (event) => {
            if (event.stream) {
              process.stdout.write(event.stream);
            }
            if (event.error) {
              console.error('Build error:', event.error);
            }
          }
        );
      });

      console.log(`✅ Successfully built ${this.imageName}:${this.imageTag}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to build default image:', error.message);
      return false;
    }
  }

  async checkImageExists() {
    try {
      await this.docker
        .getImage(`${this.imageName}:${this.imageTag}`)
        .inspect();
      return true;
    } catch {
      return false;
    }
  }

  async removeImage() {
    try {
      const image = this.docker.getImage(`${this.imageName}:${this.imageTag}`);
      await image.remove({ force: true });
      console.log(
        `🗑️ Removed existing image ${this.imageName}:${this.imageTag}`
      );
      return true;
    } catch {
      // Image doesn't exist, which is fine
      return true;
    }
  }

  getImageName() {
    return `${this.imageName}:${this.imageTag}`;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const builder = new ImageBuilder();

  const forceRebuild =
    process.argv.includes('--rebuild') || process.argv.includes('--force');

  if (await builder.checkImageExists()) {
    if (forceRebuild) {
      console.log('🔄 Rebuilding existing image...');
      await builder.removeImage();
    } else {
      console.log(
        'ℹ️ Default image already exists. Use --rebuild to force rebuild.'
      );
      process.exit(0);
    }
  }

  const success = await builder.buildDefaultImage();
  process.exit(success ? 0 : 1);
}
