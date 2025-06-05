# DockaShell CLI Usage

This guide covers common workflows and the full command reference for the `dockashell` CLI.

## 📝 CLI Workflow Examples

### Web Development Project

```bash
# Create and start project
dockashell create web-app
dockashell start web-app

# Monitor activity
dockashell logs web-app

# Make config changes, then apply
# (edit ~/.dockashell/projects/web-app/config.json)
dockashell rebuild web-app
```

### Multi-Project Management

```bash
# Overview of all projects
dockashell status

# Start multiple projects
dockashell start web-app
dockashell start api-service
dockashell start frontend

# Stop when done
dockashell stop web-app
dockashell stop api-service
```

## 📖 CLI Reference

### Status & Health

```bash
dockashell status           # System overview
dockashell status --json    # Machine-readable output
```

### Image Management

```bash
dockashell build            # Build default image
dockashell build --force    # Force rebuild
```

### Project Lifecycle

```bash
dockashell create <name>    # Create new project
dockashell start <name>     # Start project container
dockashell stop <name>      # Stop project container
dockashell rebuild <name>   # Apply config changes
```

### Monitoring & Debugging

```bash
dockashell logs             # Interactive trace viewer
dockashell logs <project>   # View specific project
```

### MCP server

```bash
dockashell serve            # Start MCP server
```

For detailed help: `dockashell help <command>`
