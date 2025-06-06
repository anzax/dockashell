# DockaShell MCP Tools

This document provides a comprehensive reference for all MCP tools exposed by DockaShell. These tools enable AI agents to interact with isolated Docker containers for secure shell execution and project management.

## Tool Categories

DockaShell exposes tools organized into four main categories:

- **[Project Management](#project-management-tools)** - Project lifecycle and status operations
- **[Shell Execution](#shell-execution-tools)** - Shell command execution and code running
- **[File Operations](#file-operations-tools)** - File creation, modification, and patching
- **[Trace & Logging](#trace--logging-tools)** - Activity tracking and audit trails

---

## Project Management Tools

### `list_projects`

Lists all configured projects with their status.

**Arguments:** None

**Returns:** Array of project objects with status information

**Example:**

```javascript
// Get overview of all projects
list_projects();
```

### `start_project`

Starts a Docker container for the specified project.

**Arguments:**

- `project_name` (string) - Name of the project to start

**Returns:** Success status and container information

**Example:**

```javascript
start_project({ project_name: 'web-app' });
```

### `stop_project`

Stops the project container.

**Arguments:**

- `project_name` (string) - Name of the project to stop

**Returns:** Success status

**Example:**

```javascript
stop_project({ project_name: 'web-app' });
```

### `project_status`

Returns detailed status information about the project container.

**Arguments:**

- `project_name` (string) - Name of the project to check

**Returns:** Detailed status including container state, ports, mounts, and resource usage

**Example:**

```javascript
project_status({ project_name: 'web-app' });
```

---

## Shell Execution Tools

### `bash`

Executes a shell command in the project container.

**Arguments:**

- `project_name` (string) - Target project name
- `command` (string) - Shell command to execute

**Returns:** Command output, exit code, and execution metadata

**Security Features:**

- Commands run as non-root user (vscode, UID 1000)
- Automatic timeout protection
- Full audit trail with timestamps
- Container isolation from host system

**Example:**

```javascript
// Run development server
bash({
  project_name: 'web-app',
  command: 'npm start',
});

// Check environment
bash({
  project_name: 'web-app',
  command: 'node --version && npm --version',
});
```

---

## File Operations Tools

### `write_file`

Creates or overwrites a file inside the container.

**Arguments:**

- `project_name` (string) - Target project name
- `path` (string) - File path inside the container
- `content` (string) - File content to write
- `overwrite` (boolean, optional) - Whether to replace existing files (default: false)

**Features:**

- Automatic creation of intermediate directories
- Safe overwrite protection (requires explicit flag)
- Full path validation

**Examples:**

```javascript
// Create new configuration file
write_file({
  project_name: 'web-app',
  path: '/workspace/config.json',
  content: '{"port": 3000, "debug": true}',
});

// Overwrite existing file
write_file({
  project_name: 'web-app',
  path: '/workspace/package.json',
  content: packageJsonContent,
  overwrite: true,
});
```

### `apply_patch`

Applies patches using the [OpenAI format](https://cookbook.openai.com/examples/gpt4-1_prompting_guide#appendix-generating-and-applying-file-diffs) inside the project container.

**Arguments:**

- `project_name` (string) - Target project name
- `patch` (string) - Patch content in OpenAI format

**Advantages:**

- Context-based matching (more reliable than line-number diffs)
- Handles file modifications, additions, and deletions
- Robust against formatting changes
- Perfect for iterative edits

**Patch Format:**

```
--- a/path/to/file.js
+++ b/path/to/file.js
@@ ... @@
 context line
-old line
+new line
 context line
```

**Example:**

```javascript
apply_patch({
  project_name: 'web-app',
  patch: `--- a/src/app.js
+++ b/src/app.js
@@ -10,7 +10,7 @@
 
 app.get('/', (req, res) => {
-  res.send('Hello World!');
+  res.send('Hello DockaShell!');
 });`,
});
```

---

## Trace & Logging Tools

### `write_trace`

Writes an arbitrary note to the project trace log for documentation and debugging.

**Arguments:**

- `project_name` (string) - Target project name
- `type` (string) - Trace type: "user", "agent", or "summary"
- `text` (string) - Trace content

**Use Cases:**

- Document reasoning and planning steps
- Record user inputs and decisions
- Mark project milestones
- Debug agent behavior

**Examples:**

```javascript
// Document planning phase
write_trace({
  project_name: 'web-app',
  type: 'agent',
  text: 'Planning React component structure for user dashboard',
});

// Record user decision
write_trace({
  project_name: 'web-app',
  type: 'user',
  text: 'User requested dark mode toggle implementation',
});

// Mark completion
write_trace({
  project_name: 'web-app',
  type: 'summary',
  text: 'Successfully implemented authentication system with JWT tokens',
});
```

### `read_traces`

Returns formatted trace entries with advanced filtering and field selection capabilities.

**Arguments:**

- `project_name` (string) - Target project name
- `type` (string, optional) - Filter by trace type
- `search` (string, optional) - Search term across trace content
- `skip` (number, optional) - Number of entries to skip (pagination)
- `limit` (number, optional) - Maximum entries to return
- `fields` (string[], optional) - Specific fields to include
- `output_max_len` (number, optional) - Maximum length for output preview (default: 1000)

**Field Options:**

- `timestamp`, `type`, `content` - Always included for context
- `exit_code`, `duration` - Command execution metadata (commands only)
- `output` - Command output preview (truncated to `output_max_len`)

**Type Filtering:**

- `"command"` - Shell command executions only
- `"note"` - All note types (user, agent, summary)
- `"user"`, `"agent"`, `"summary"` - Specific note types

**Usage Examples:**

```javascript
// Recent activity overview
read_traces('web-app', { limit: 10 });

// Debug failed commands with full output
read_traces('web-app', {
  type: 'command',
  fields: ['timestamp', 'type', 'content', 'exit_code', 'output'],
  output_max_len: 5000,
});

// Search for error-related entries
read_traces('web-app', { search: 'error' });

// Get agent reasoning steps only
read_traces('web-app', {
  type: 'agent',
  limit: 20,
});

// Paginated access to command history
read_traces('web-app', {
  type: 'command',
  skip: 50,
  limit: 25,
});
```

---

## Best Practices

### File Operations

- Use `apply_patch` for incremental edits (more reliable)
- Use `write_file` for new files or complete rewrites
- Set `overwrite: true` explicitly when replacing existing files

### Execution Safety

- Keep commands focused and specific
- Use timeouts appropriately for long-running processes
- Monitor command exit codes for error detection

### Tracing & Documentation

- Use `write_trace` liberally to document reasoning
- Include context in trace messages for future reference
- Use different trace types to organize information
- Query traces with `read_traces` for debugging and context

### Performance Optimization

- Limit `read_traces` results with `limit` parameter
- Use field selection to reduce data transfer
- Use `skip` for pagination when processing large trace sets
- Set appropriate `output_max_len` based on needs
