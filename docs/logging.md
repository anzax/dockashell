# Logging and Tracing

DockaShell records activity through two mechanisms: system logs for diagnostics and per-project trace files for agent observability. Both are implemented in the codebase and enabled by default.

## System Logs

- **Path**: `~/.dockashell/logs/system.log`
- **Format**: human readable text with log levels
- **Rotation**: handled externally (overwritten on each run)
- Logged via `SystemLogger` in `src/system-logger.js`

System logs contain operational messages and error details that help developers debug DockaShell itself.

## Agent Traces

- **Path**: `~/.dockashell/projects/{project}/traces/current.jsonl`
- **Format**: JSON Lines, one structured object per entry
- **Session Rotation**: automatically rotates when no trace has been written for four hours (configurable via `logging.traces.session_timeout`). Sessions persist across restarts within this window so the `current.jsonl` file remains active.
- Managed by `TraceRecorder` in `src/trace-recorder.js`
- Accessed through the `Logger` facade (`src/logger.js`)

Trace entries capture tool activity and notes. Each includes:

- `id` – unique trace identifier
- `session_id` – current session identifier
- `project_name` – project context
- `timestamp` – ISO time string
- `tool` – component emitting the trace
- `trace_type` – `execution`, `observation` or `decision`
- Additional tool‑specific data (command, result, diff, etc.)

## Reading Traces

DockaShell exposes a `read_traces` MCP tool and a helper method in `Logger` to read trace entries. Results can be filtered by type, searched, and limited. The Terminal UI consumes this API to display project history.

## Planned Enhancements (TBC)

- Compress completed trace sessions
- Correlation IDs for cross‑tool relationships
- Advanced filtering and search
- Session replay visualisation in the TUI

