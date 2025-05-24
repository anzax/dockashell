# Phase 1 - Lean Core

The first phase of the new DockaShell logging system introduces two lightweight
components that run alongside the existing logger. The goal is to keep the
current API stable while writing to a more structured trace format for future
features.

## Components

### SystemLogger
Traditional text logging intended for developers. Log entries are appended to
`~/.dockashell/logs/system.log` with a timestamp and level.

### TraceRecorder
A structured recorder for agent activity. Traces are stored as JSON Lines under
`~/.dockashell/projects/{name}/traces/current.jsonl`.

### Logger Facade
The existing `Logger` class becomes a facade. It continues to expose
`logCommand` and `logNote` but now delegates to `SystemLogger` and
`TraceRecorder` behind the scenes. Both legacy log files and new traces are
written during this phase to avoid data loss.

## Benefits
- Clear separation between developer logs and agent traces
- Backward compatibility with the previous `Logger` API
- Provides the foundation for future observability tooling
