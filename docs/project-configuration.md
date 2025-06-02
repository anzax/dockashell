# Project Configuration

DockaShell stores each project's config in `~/.dockashell/projects/{name}/config.json`. These JSON files define how containers are started.

## Common Fields

- `name` – Project name
- `description` – Optional description
- `image` – Docker image to use (defaults to `dockashell/default-dev:latest`)
- `mounts` – List of host paths mounted into the container
- `ports` – Ports forwarded from host to container
- `environment` – Environment variables
- `working_dir` – Default working directory inside the container
- `shell` – Login shell
- `security.max_execution_time` – Maximum seconds for any command

## Example: Node.js Web App

```json
{
  "name": "web-app",
  "description": "Node.js web application with hot reload",
  "mounts": [
    {
      "host": "~/projects/web-app",
      "container": "/workspace",
      "readonly": false
    }
  ],
  "ports": [
    { "host": 3000, "container": 3000 },
    { "host": 8080, "container": 8080 }
  ],
  "environment": {
    "NODE_ENV": "development"
  },
  "working_dir": "/workspace",
  "shell": "/bin/bash",
  "security": { "max_execution_time": 300 }
}
```

## Example: Custom Image

```json
{
  "name": "legacy-app",
  "image": "node:16-bullseye",
  "mounts": [
    {
      "host": "~/projects/legacy-app",
      "container": "/workspace",
      "readonly": false
    }
  ],
  "ports": [{ "host": 3000, "container": 3000 }],
  "working_dir": "/workspace",
  "shell": "/bin/bash"
}
```
