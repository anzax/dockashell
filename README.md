# DockaShell v0.1

> AI agent secure Docker environments for project work

DockaShell provides isolated, persistent Docker containers for AI agents to safely execute code and build projects. Each project gets its own container with configurable security, port mappings, and file mounts.

## ✨ Features

- **🔒 Project Isolation**: Each project runs in its own Docker container
- **🚀 Persistent State**: Containers maintain state across command executions
- **🌐 Port Mapping**: Easy web development with automatic port forwarding
- **📁 File Mounting**: Seamless file access between host and container
- **🛡️ Security Controls**: Configurable command blocking and timeouts
- **📊 Command Logging**: Full audit trail of all executed commands
- **🔧 MCP Integration**: Standard Model Context Protocol interface

## 🚀 Quick Start

### 1. Installation

```bash
git clone <repository>
cd dockashell
npm install
```

### 2. Create Example Projects

```bash
npm run setup-examples
```

This creates three example projects:
- `web-app` - Node.js development (ports 3000, 8080)
- `data-science` - Python environment (port 8888)
- `react-app` - React/TypeScript setup (port 3000)

### 3. Test with MCP Inspector

```bash
npm run test
```

In the MCP inspector interface, try these commands:

**List all projects:**
```json
Tool: list_projects
```

**Start a project:**
```json
Tool: start_project
Arguments: {"project_name": "web-app"}
```

**Run commands:**
```json
Tool: run_command
Arguments: {"project_name": "web-app", "command": "node --version"}
```

**Check project status:**
```json
Tool: project_status
Arguments: {"project_name": "web-app"}
```

**Stop the project:**
```json
Tool: stop_project
Arguments: {"project_name": "web-app"}
```

## 📝 Example Workflow

Here's how an AI agent would typically use DockaShell:

```javascript
// 1. List available projects
list_projects()

// 2. Start a web development project
start_project({"project_name": "web-app"})

// 3. Initialize a new Node.js project
run_command({
  "project_name": "web-app",
  "command": "npm init -y"
})

// 4. Install dependencies
run_command({
  "project_name": "web-app",
  "command": "npm install express"
})

// 5. Create a simple server
run_command({
  "project_name": "web-app",
  "command": "echo 'const express = require(\"express\"); const app = express(); app.get(\"/\", (req, res) => res.send(\"Hello World!\")); app.listen(3000);' > app.js"
})

// 6. Start the server
run_command({
  "project_name": "web-app",
  "command": "node app.js"
})

// Server is now running at http://localhost:3000
```

## ⚙️ Configuration

Projects are configured in `~/.dockashell/projects/{project-name}/config.json`:

```json
{
  "name": "my-project",
  "description": "Project description",
  "image": "node:18-bullseye",
  "mounts": [
    {
      "host": "~/projects/my-project",
      "container": "/workspace",
      "readonly": false
    }
  ],
  "ports": [
    {
      "host": 3000,
      "container": 3000
    }
  ],
  "environment": {
    "NODE_ENV": "development"
  },
  "working_dir": "/workspace",
  "shell": "/bin/bash",
  "security": {
    "restricted_mode": false,
    "blocked_commands": ["rm -rf /", "sudo rm -rf"],
    "max_execution_time": 300
  }
}
```

### Configuration Options

| Field | Description | Default |
|-------|-------------|---------|
| `name` | Project identifier | (required) |
| `description` | Human-readable description | "" |
| `image` | Docker image to use | "ubuntu:latest" |
| `mounts` | File system mounts | [] |
| `ports` | Port mappings | [] |
| `environment` | Environment variables | {} |
| `working_dir` | Container working directory | "/workspace" |
| `shell` | Default shell | "/bin/bash" |
| `security.restricted_mode` | Enable security restrictions | false |
| `security.blocked_commands` | Commands to block | [] |
| `security.max_execution_time` | Command timeout (seconds) | 300 |

## 🔧 MCP Tools

DockaShell exposes 5 MCP tools:

### `list_projects`
Lists all configured projects with their status.

### `start_project`
**Arguments:** `{"project_name": "string"}`
Starts a Docker container for the specified project.

### `run_command`
**Arguments:** `{"project_name": "string", "command": "string"}`
Executes a shell command in the project container.

### `project_status`
**Arguments:** `{"project_name": "string"}`
Returns detailed status information about the project container.

### `stop_project`
**Arguments:** `{"project_name": "string"}`
Stops the project container.

## 🛡️ Security Features

- **Command Blocking**: Configure dangerous commands to reject
- **Execution Timeouts**: Prevent runaway processes
- **Container Isolation**: Each project is completely isolated
- **Non-privileged Execution**: Containers run without root access
- **Audit Logging**: All commands logged with timestamps

### Default Blocked Commands

When `restricted_mode` is enabled:
- `rm -rf /` - Recursive delete of root
- `:(){ :|:& };:` - Fork bomb
- `sudo rm -rf` - Privileged delete
- `mkfs` - Format filesystem
- `dd if=/dev/zero` - Zero out devices

## 📊 Logging

Commands are logged to `~/.dockashell/logs/{project-name}.log`:

```
2024-05-22T10:30:15.123Z [START] project=web-app container=abc123 ports=3000:3000
2024-05-22T10:30:16.456Z [EXEC] project=web-app command="npm install" exit_code=0 duration=2.3s
2024-05-22T10:30:20.789Z [EXEC] project=web-app command="npm start" exit_code=0 duration=0.1s
```

## 🔌 MCP Client Integration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "dockashell": {
      "command": "node",
      "args": ["path/to/dockashell/src/mcp-server.js"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "dockashell": {
      "command": "dockashell"
    }
  }
}
```

## 📋 Requirements

- **Node.js 18+**
- **Docker** installed and running
- **Home directory write access** for configuration storage

## 🏗️ Architecture

```
DockaShell
├── MCP Server (src/mcp-server.js)
│   └── Exposes 5 tools via Model Context Protocol
├── Project Manager (src/project-manager.js)
│   └── Loads configs, parses devcontainers
├── Container Manager (src/container-manager.js)
│   └── Docker operations via dockerode
├── Security Manager (src/security.js)
│   └── Command validation and blocking
└── Logger (src/logger.js)
    └── Persistent command logging
```

## 🧪 Development

### Validate Components
```bash
npm run validate
```

### Create Test Projects
```bash
npm run setup-examples
```

### Test with MCP Inspector
```bash
npm run test
```

### Run Server Directly
```bash
npm start
```

## 📁 File Structure

```
dockashell/
├── src/
│   ├── mcp-server.js        # Main MCP server
│   ├── project-manager.js   # Project config handling
│   ├── container-manager.js # Docker operations
│   ├── security.js          # Command validation
│   └── logger.js            # Command logging
├── package.json
├── README.md
├── test.js                  # Component validation
└── create-examples.js       # Example project setup
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run validate` to test
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for the AI-first development era** 🚀

DockaShell enables AI agents to work safely and effectively in isolated environments while maintaining the flexibility and power of full development stacks.
