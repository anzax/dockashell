# Phase 3 Cleanup Guide

The final migration step removes the legacy per-project log files. Only `system.log` and structured trace files remain.

## Removing old logs

1. Delete the directory `~/.dockashell/logs/` if it still contains `*.log` or `*.jsonl` files.
2. Each project continues to store traces under `~/.dockashell/projects/{name}/traces/`.

After cleanup DockaShell will write agent activity exclusively to the trace files.
