# Logging Migration Progress

This document records high level decisions and status updates while introducing
the new logging system.

- **Decision:** Keep the existing `Logger` interface intact for the first
  release so external tools do not break.
- **Decision:** Write to both the legacy log files and the new trace files until
  we are confident that traces cover all use cases.
- **Status 2025-05-01:** Phase&nbsp;1 classes (`SystemLogger` and `TraceRecorder`)
  implemented along with the updated `Logger` facade.
- **Status 2025-05-02:** Added recorder cleanup on shutdown and moved trace sessions to `sessions/` directory on close.

Add further notes below as the migration continues.
