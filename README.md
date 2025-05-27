# DockaShell v0.1

> AI agent secure Docker environments for project work

DockaShell provides isolated, persistent Docker containers for AI agents to safely execute code and build projects. Each project gets its own container with configurable security, port mappings, and volume mounts.

## ✨ Features

- **🔒 Project Isolation**: Each project runs in its own Docker container
- **🚀 Persistent State**: Containers maintain state across command executions
- **🌐 Port Mapping**: Easy web development with automatic port forwarding
- **📁 Project Directory Mounting**: Seamless file access between host and container
- **🛡️ Security Controls**: Execution timeouts for commands
- **📊 Command Logging**: Full audit trail of all executed commands
- **🔧 MCP Integration**: Standard Model Context Protocol interface
- **🐳 Default Development Image**: Pre-built Ubuntu 24.04 LTS with Node.js 20 LTS, Python 3, and essential CLI tools

---

## Experimental technology disclaimer
DockaShell is an experimental project under active development. It is not yet stable, may contain bugs, incomplete features, or undergo breaking changes.

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone <repository>
cd dockashell
npm install
```

### 2. Build the Default Docker Image

```bash
npm run build-image
```

### 3. Create Example Projects

```bash
npm run setup-examples
```

## 🐳 Default Development Image

DockaShell includes a comprehensive default development image (`dockashell/default-dev:latest`) based on:

- **Ubuntu 24.04 LTS (Noble Numbat)** - Long-term support until 2029
- **Node.js 20 LTS** - Active LTS support
- **Python 3** with pip and venv
- **Essential CLI Tools**: patch, diff, grep, sed, gawk, rg, cat, head, tail, find, tree, zip, unzip, curl, wget, nano, vim, git, jq

- **Package Managers**: npm, pnpm, pip3
- **Non-root developer user** with sudo access

### Benefits of the Default Image

- **Consistency**: Every project gets the same comprehensive environment
- **Simplicity**: Project configs focus on project-specific needs (ports, mounts, environment)
- **Performance**: Base image is cached and reused across all projects
- **Zero Configuration**: Works out-of-the-box for most development workflows

### Using Custom Images

You can still specify custom Docker images in your project configuration when needed:

```json
{
  "name": "legacy-project",
  "image": "node:16-bullseye",
  "description": "Project requiring specific Node.js version"
}
```

### Building the Default Image

```bash
# Build the default image
npm run build-image

# Force rebuild
npm run rebuild-image
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
    "max_execution_time": 300
  }
}
```

Note: The `image` field is optional - if omitted, projects will use the default `dockashell/default-dev:latest` image.

### Configuration Options

| Field | Description | Default |
|-------|-------------|---------|
| `name` | Project identifier | (required) |
| `description` | Human-readable description | "" |
| `image` | Docker image to use | "dockashell/default-dev:latest" |
| `mounts` | File system mounts | [] |
| `ports` | Port mappings | [] |
| `environment` | Environment variables | {} |
| `working_dir` | Container working directory | "/workspace" |
| `shell` | Default shell | "/bin/bash" |
| `security.max_execution_time` | Command timeout (seconds) | 300 |

## 🔧 MCP Tools

DockaShell exposes several MCP tools:

### `list_projects`
Lists all configured projects with their status.

### `start_project`
**Arguments:** `{"project_name": "string"}`
Starts a Docker container for the specified project.

### `run_command`
**Arguments:** `{"project_name": "string", "command": "string"}`
Executes a shell command in the project container.

### `apply_patch`
**Arguments:** `{"project_name": "string", "patch": "string"}`
Applies patches using the [OpenAI format](https://cookbook.openai.com/examples/gpt4-1_prompting_guide#appendix-generating-and-applying-file-diffs) inside the project container with context-based matching. More reliable than line-number based diffs for iterative edits.

### `write_file`
**Arguments:** `{"project_name": "string", "path": "string", "content": "string", "overwrite?": "boolean"}`
Creates or overwrites a file inside the container. Intermediate directories are created automatically. Set `overwrite` to `true` to replace existing files (defaults to `false`).

### `project_status`
**Arguments:** `{"project_name": "string"}`
Returns detailed status information about the project container.

### `stop_project`
**Arguments:** `{"project_name": "string"}`
Stops the project container.

### `write_trace`
**Arguments:** `{"project_name": "string", "type": "user|summary|agent", "text": "string"}`
Writes an arbitrary note to the project trace log.

### `read_traces`
**Arguments:** `{"project_name": "string", "type?": "string", "search?": "string", "skip?": "number", "limit?": "number", "fields?": "string[]"}`
Returns formatted trace entries with optional filtering and field selection.

**Field Options:**
- `timestamp`, `type`, `content` - Always included for context
- `exit_code`, `duration` - Command execution metadata (commands only)
- `output` - Command output preview, truncated to 200 chars for display (commands only)

**Type Filtering:**
- `"command"` - Shell command executions only
- `"note"` - All note types (user, agent, summary)
- `"user"`, `"agent"`, `"summary"` - Specific note types

**Usage Examples:**
```javascript
// Recent activity overview
read_traces("project", {limit: 10})

// Debug failed commands with output
read_traces("project", {type: "command", fields: ["timestamp", "type", "content", "exit_code", "output"]})

// Search across commands and output
read_traces("project", {search: "error"})
```

## 🛡️ Security Features

- **Command Blocking**: Configure dangerous commands to reject
- **Execution Timeouts**: Prevent runaway processes
- **Container Isolation**: Each project is completely isolated
- **Non-privileged Execution**: Containers run without root access
- **Audit Logging**: All commands logged with timestamps

## 📊 Logging

Agent traces are stored in `~/.dockashell/projects/{project-name}/traces/current.jsonl`:

```
{"id":"tr_abc123","tool":"start_project","trace_type":"execution","project_name":"web-app","result":{"success":true}}
{"id":"tr_def456","tool":"write_trace","trace_type":"observation","type":"agent","text":"Planning React app"}
{"id":"tr_ghi789","tool":"run_command","trace_type":"execution","command":"npm start","result":{"exitCode":0,"duration":"0.1s"}}
```

Use `write_trace` to store notes and `read_traces` to query previous entries.

Trace sessions rotate automatically when there are more than four hours between
entries. If DockaShell restarts within this window, the same `current.jsonl`
file continues to be used so history remains visible in the TUI. The timeout can
be changed in `~/.dockashell/config.json` using `logging.traces.session_timeout`
(e.g. `"2h"`). The default configuration sets this to `"4h"`:

```json
{
  "logging": {
    "traces": {
      "session_timeout": "4h"
    }
  }
}
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

---

## 🖥️ Terminal User Interface (TUI)

DockaShell includes a Terminal User Interface for viewing agent activity and project traces.

### Usage

**Interactive project selector:**
```bash
dockashell-tui
```

**Direct project access:**
```bash
dockashell-tui myproject
```

### Features

- **Project Discovery**: Automatically finds all DockaShell projects
- **Activity Sorting**: Projects sorted by most recent activity
- **Trace Viewing**: Navigate through agent logs with keyboard
- **Entry Types**: Displays user inputs, agent reasoning, and command results
- **Configurable**: Customizable display settings via `~/.dockashell/config.json`

### Navigation

**Project Selector:**
- `↑↓` Navigate projects
- `Enter` Select project
- `q` Quit

**Trace Viewer:**
- `↑↓` Navigate entries
- `b` Back to project selector
- `q` Quit

### Configuration

TUI settings in `~/.dockashell/config.json`:

```json
{
  "tui": {
    "display": {
      "max_entries": 100
    }
  }
}
```

The TUI provides immediate visibility into what agents are working on without interrupting their progress.

---

## 📄 License

Apache License 2.0 - see LICENSE file for details.
