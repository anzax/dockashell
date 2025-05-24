# Phase 4 - Real-Time Updates & Session Navigation

The next milestone for the DockaShell logging system focuses on live trace viewing and managing past sessions. Phase 4 builds upon the cleanup of legacy logs by introducing real-time file watching and navigating between trace sessions.

## Objectives

1. **Live Trace Updates**
   - Use `chokidar` to watch `current.jsonl` for each project.
   - Append new trace entries to the TUI view as they are written.
   - Keep refresh (`r`) as a fallback for broken watchers or manual reload.

2. **Session Navigation**
   - Maintain an index of session files under `traces/sessions/` ordered chronologically.
   - Provide TUI commands to jump to the previous or next session.
   - Load only one session at a time to avoid unbounded memory usage.

3. **Performance Considerations**
   - Treat sessions as "pages" so the viewer can release old data when switching.
   - Limit loaded entries via `max_entries` to keep rendering snappy.
   - Document recommended session rotation for large projects.

## Implementation Notes

- `LogViewer` should start a `chokidar.watch` on mount and close it on unmount.
- New component(s) will present a list of available sessions with navigation keys.
- Update `docs/logging/07-PROGRESS_TRACKING.md` with Phase 4 status entries as work proceeds.

Phase 4 completes the migration by making trace viewing seamless and scalable while preparing for future analytics.
