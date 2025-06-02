import Docker from 'dockerode';

const docker = new Docker();

export async function checkDockerDaemon() {
  try {
    const info = await docker.info();
    return { running: true, version: info.ServerVersion };
  } catch (err) {
    return { running: false, error: err.message };
  }
}

export async function checkImageExists(image) {
  try {
    const data = await docker.getImage(image).inspect();
    return { exists: true, created: data.Created };
  } catch {
    return { exists: false };
  }
}

export async function getContainerState(name) {
  try {
    const data = await docker.getContainer(name).inspect();
    return { exists: true, running: data.State.Running };
  } catch (err) {
    if (err.statusCode === 404) {
      return { exists: false, running: false };
    }
    throw err;
  }
}
