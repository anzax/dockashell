import Docker from 'dockerode';
import os from 'os';
import { PassThrough } from 'stream';
import { Logger } from './logger.js';

export class ContainerManager {
  constructor(projectManager) {
    this.docker = new Docker();
    this.projectManager = projectManager;
    this.containers = new Map();
    this.logger = new Logger();
  }

  async startContainer(projectName) {
    const containerName = `dockashell-${projectName}`;

    try {
      // Check if container already exists
      const existingContainer = this.docker.getContainer(containerName);
      try {
        const data = await existingContainer.inspect();
        if (data.State.Running) {
          this.containers.set(projectName, existingContainer);

          await this.logger.logCommand(projectName, 'start', {
            type: 'start',
            containerId: data.Id.substring(0, 12),
            note: 'Already running',
          });

          return {
            success: true,
            containerId: data.Id.substring(0, 12),
            status: 'already_running',
            image: data.Config.Image,
            created: data.Created,
            ports: this.extractPortMappings(data),
            mounts: this.extractMounts(data),
          };
        } else {
          // Container exists but is stopped, start it
          await existingContainer.start();
          this.containers.set(projectName, existingContainer);

          await this.logger.logCommand(projectName, 'start', {
            type: 'start',
            containerId: data.Id.substring(0, 12),
            note: 'Restarted existing container',
          });

          return {
            success: true,
            containerId: data.Id.substring(0, 12),
            status: 'started',
            image: data.Config.Image,
            created: data.Created,
            ports: this.extractPortMappings(data),
            mounts: this.extractMounts(data),
          };
        }
      } catch (inspectError) {
        if (inspectError.statusCode !== 404) {
          throw inspectError;
        }
        // Container doesn't exist, create it below
      }
    } catch {
      // Container doesn't exist, continue to create it
    }

    // Load project configuration
    const config = await this.projectManager.loadProject(projectName);

    // Create port bindings
    const portBindings = {};
    const exposedPorts = {};

    if (config.ports) {
      config.ports.forEach((portMapping) => {
        const containerPort = `${portMapping.container}/tcp`;
        exposedPorts[containerPort] = {};
        portBindings[containerPort] = [
          { HostPort: portMapping.host.toString() },
        ];
      });
    }

    // Create volume bindings
    const binds = [];
    if (config.mounts) {
      config.mounts.forEach((mount) => {
        const hostPath = mount.host.replace('~', os.homedir());
        const readonlyFlag = mount.readonly ? ':ro' : '';
        binds.push(`${hostPath}:${mount.container}${readonlyFlag}`);
      });
    }

    // Create container
    const container = await this.docker.createContainer({
      Image: config.image,
      name: containerName,
      Env: config.environment
        ? Object.entries(config.environment).map(
            ([key, value]) => `${key}=${value}`
          )
        : [],
      WorkingDir: config.working_dir || '/workspace',
      Cmd: [config.shell || '/bin/bash'],
      Tty: true,
      OpenStdin: true,
      ExposedPorts: exposedPorts,
      HostConfig: {
        PortBindings: portBindings,
        Binds: binds,
        AutoRemove: false, // Keep container after stop for persistence
        RestartPolicy: { Name: 'no' },
      },
    });

    // Start container
    await container.start();
    this.containers.set(projectName, container);

    // Log the start
    const data = await container.inspect();
    await this.logger.logCommand(projectName, 'start', {
      type: 'start',
      containerId: data.Id.substring(0, 12),
    });

    return {
      success: true,
      containerId: data.Id.substring(0, 12),
      status: 'started',
      image: config.image,
      created: data.Created,
      ports: this.extractPortMappings(data),
      mounts: this.extractMounts(data),
    };
  }

  async stopContainer(projectName) {
    const containerName = `dockashell-${projectName}`;

    try {
      const container = this.docker.getContainer(containerName);
      const data = await container.inspect();

      if (data.State.Running) {
        await container.stop();
      }

      this.containers.delete(projectName);

      await this.logger.logCommand(projectName, 'stop', {
        type: 'stop',
        containerId: data.Id.substring(0, 12),
      });

      return {
        success: true,
        containerId: data.Id.substring(0, 12),
        status: 'stopped',
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          success: true,
          status: 'not_found',
        };
      }
      throw error;
    }
  }

  async executeCommand(projectName, command, options = {}) {
    const containerName = `dockashell-${projectName}`;
    const timeoutMs = options.timeout || 30000;
    const startTime = Date.now();

    try {
      const container = this.docker.getContainer(containerName);

      // Check if container is running
      const data = await container.inspect();
      if (!data.State.Running) {
        throw new Error(
          'Container is not running. Please start the project first.'
        );
      }

      // Create exec instance
      const exec = await container.exec({
        Cmd: ['bash', '-c', command],
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
      });

      // Start exec and capture output
      const stream = await exec.start({ Detach: false, Tty: false });

      let output = '';
      let error = '';

      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();
      container.modem.demuxStream(stream, stdoutStream, stderrStream);

      let timedOut = false;

      const result = await Promise.race([
        new Promise((resolve, reject) => {
          stdoutStream.on('data', (chunk) => {
            output += chunk.toString();
          });

          stderrStream.on('data', (chunk) => {
            error += chunk.toString();
          });

          stream.on('end', async () => {
            try {
              const inspect = await exec.inspect();
              resolve({
                stdout: output.trim(),
                stderr: error.trim(),
                exitCode: inspect.ExitCode,
                timedOut,
              });
            } catch (inspectError) {
              reject(inspectError);
            }
          });

          stream.on('error', reject);
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            timedOut = true;
            (async () => {
              try {
                const info = await exec.inspect();
                if (info.Pid) {
                  const killer = await container.exec({
                    Cmd: ['kill', '-TERM', info.Pid.toString()],
                    AttachStdout: false,
                    AttachStderr: false,
                    Tty: false,
                  });
                  await killer.start({ Detach: true, Tty: false });
                }
              } catch {
                // Ignore errors when killing container
              }
              stream.destroy();
              reject(new Error('Command timed out'));
            })();
          }, timeoutMs);
        }),
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      // Log the command execution including full output for later preview
      await this.logger.logCommand(projectName, command, {
        type: 'exec',
        exitCode: result.exitCode,
        duration: `${duration}s`,
        timedOut: result.timedOut,
        output: result.stdout || '',
      });

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.timedOut || false,
        duration: `${duration}s`,
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (error.message === 'Command timed out') {
        await this.logger.logCommand(projectName, command, {
          type: 'exec',
          exitCode: -1,
          duration: `${duration}s`,
          timedOut: true,
          output: '',
        });

        return {
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: 'Command timed out',
          timedOut: true,
          duration: `${duration}s`,
        };
      }

      throw error;
    }
  }

  async applyPatch(projectName, patch, options = {}) {
    const containerName = `dockashell-${projectName}`;
    const timeoutMs = options.timeout || 30000;
    const startTime = Date.now();

    try {
      const container = this.docker.getContainer(containerName);

      const data = await container.inspect();
      if (!data.State.Running) {
        throw new Error(
          'Container is not running. Please start the project first.'
        );
      }

      // Apply the patch using the Python script
      const exec = await container.exec({
        Cmd: ['python3', '/usr/local/bin/apply_patch.py'],
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: true,
        Tty: false,
      });

      const stream = await exec.start({
        Detach: false,
        Tty: false,
        hijack: true,
        stdin: true,
      });

      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();
      container.modem.demuxStream(stream, stdoutStream, stderrStream);

      let output = '';
      let error = '';
      let timedOut = false;

      // Send patch data to stdin
      stream.write(patch);
      stream.end();

      const result = await Promise.race([
        new Promise((resolve, reject) => {
          stdoutStream.on('data', (chunk) => {
            output += chunk.toString();
          });

          stderrStream.on('data', (chunk) => {
            error += chunk.toString();
          });

          stream.on('end', async () => {
            try {
              const inspect = await exec.inspect();
              resolve({
                stdout: output.trim(),
                stderr: error.trim(),
                exitCode: inspect.ExitCode,
                timedOut,
              });
            } catch (inspectError) {
              reject(inspectError);
            }
          });

          stream.on('error', reject);
        }),
        new Promise((_, reject) => {
          setTimeout(() => {
            timedOut = true;
            stream.destroy();
            reject(new Error('Patch apply timed out'));
          }, timeoutMs);
        }),
      ]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      await this.logger.logToolExecution(
        projectName,
        'apply_patch',
        { patch },
        {
          exitCode: result.exitCode,
          duration: `${duration}s`,
          timedOut: result.timedOut,
          output: [result.stdout, result.stderr].filter(Boolean).join('\n'),
        }
      );

      return {
        success: result.exitCode === 0,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: result.timedOut || false,
        duration: `${duration}s`,
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      await this.logger.logToolExecution(
        projectName,
        'apply_patch',
        { patch },
        {
          exitCode: -1,
          duration: `${duration}s`,
          timedOut: false,
          output: error.message || '',
        }
      );
      throw error;
    }
  }

  async getStatus(projectName) {
    const containerName = `dockashell-${projectName}`;

    try {
      const container = this.docker.getContainer(containerName);
      const data = await container.inspect();

      return {
        success: true,
        containerId: data.Id.substring(0, 12),
        status: data.State.Running ? 'running' : 'stopped',
        image: data.Config.Image,
        created: data.Created,
        ports: this.extractPortMappings(data),
        mounts: this.extractMounts(data),
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return {
          success: true,
          status: 'not_found',
        };
      }
      throw error;
    }
  }

  extractMounts(containerData) {
    if (!containerData.Mounts) return [];

    return containerData.Mounts.map((mount) => ({
      source: mount.Source,
      destination: mount.Destination,
      mode: mount.RW ? 'rw' : 'ro',
    }));
  }

  extractPortMappings(containerData) {
    const ports = [];
    const portBindings = containerData.HostConfig?.PortBindings || {};

    Object.entries(portBindings).forEach(([containerPort, mappings]) => {
      if (mappings && mappings.length > 0) {
        ports.push({
          container: parseInt(containerPort.split('/')[0]),
          host: parseInt(mappings[0].HostPort),
        });
      }
    });

    return ports;
  }

  async withTimeout(promise, timeoutMs, operation = 'Operation') {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  }

  async cleanup() {
    // DO NOT STOP CONTAINERS - let them persist across MCP restarts
    // Only clear the in-memory references
    this.containers.clear();

    // Optionally log that we're disconnecting but leaving containers running
  }
}
