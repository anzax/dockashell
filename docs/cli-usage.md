# DockaShell CLI Usage

## 📝 Quick Start

```bash
# Check system health
dockashell status

# Build default development image
dockashell build

# Create and start a project
dockashell create web-app
dockashell start web-app

# Monitor activity
dockashell logs web-app
```

## 📖 Command Reference

### System Status

**`dockashell status [--json]`** Show comprehensive system status including Docker daemon, default image, and all projects with container states.

```bash
dockashell status                   # Human-readable overview
dockashell status --json            # For scripts/automation
```

### Image Management

**`dockashell build [--force]`** Build the default DockaShell development image with Python 3.12, Node.js 20 LTS, and essential development tools.

```bash
dockashell build                    # Build if missing
dockashell build --force            # Force fresh rebuild
```

### Project Management

**`dockashell create <project>`** Create a new project with default configuration.

```bash
dockashell create my-web-app        # Create web project
dockashell create data-science      # Create data project
```

**`dockashell start <project>`** Start a project container. Creates container from config if needed.

```bash
dockashell start web-app            # Start web-app project
dockashell start data-analysis      # Start data project
```

**`dockashell stop <project>`** Stop a running project container gracefully.

```bash
dockashell stop web-app             # Stop specific project
```

**`dockashell rebuild <project>`** Stop, remove, and restart project container to apply configuration changes.

```bash
dockashell rebuild web-app          # Apply config changes
```

### Monitoring

**`dockashell logs [project]`** Launch interactive trace viewer (TUI) for monitoring project activity.

```bash
dockashell logs                     # Show project selector
dockashell logs web-app             # Open specific project
```

**Keyboard shortcuts in trace viewer:**

- ↑↓ Navigate traces
- Enter: View trace details
- f: Filter by type
- /: Search
- q: Quit

### MCP Integration

**`dockashell serve`** Start MCP (Model Context Protocol) server for AI agent integration.

```bash
dockashell serve                    # Start stdio server
```

**`dockashell remote [options]`** Start remote MCP server with HTTP transport and authentication.

```bash
dockashell remote --setup-auth      # Setup authentication
dockashell remote                   # Start on default port 3333
dockashell remote -p 8080           # Start on custom port
```

Options:

- `-p, --port <port>` - Port to run server on (default: 3333)
- `--setup-auth` - Setup initial authentication credentials

### Help

**`dockashell help [command]`** Show detailed help for command.

```bash
dockashell help                     # Show main help
dockashell help status              # Show detailed help for status
```

## 🔄 Common Workflows

### Web Development Project

```bash
# Setup
dockashell build
dockashell create web-app
dockashell start web-app

# Development
dockashell logs web-app             # Monitor in separate terminal

# Apply config changes
# (edit ~/.dockashell/projects/web-app/config.json)
dockashell rebuild web-app
```

### Multi-Project Management

```bash
# Overview
dockashell status

# Start multiple projects
dockashell start web-app
dockashell start api-service
dockashell start frontend

# Monitor all activity
dockashell logs                     # Use project selector

# Stop when done
dockashell stop web-app
dockashell stop api-service
dockashell stop frontend
```

### AI Agent Integration

```bash
# Local AI client integration
dockashell serve

# Remote AI client integration
dockashell remote --setup-auth      # One-time setup
dockashell remote                   # Start server
```

For detailed help on any command: `dockashell help <command>`
