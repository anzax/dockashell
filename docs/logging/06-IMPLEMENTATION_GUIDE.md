# Implementation Guide

This guide summarises how Phase&nbsp;1 is wired into the codebase. The design is
lightweight so the steps here focus on behaviour rather than the exact class
structure.

1. **Create `SystemLogger`** – a small wrapper that appends formatted text
   entries to `system.log`. It exposes convenience methods for the common log
   levels (`info`, `warn`, `error`, `debug`).
2. **Create `TraceRecorder`** – responsible for writing structured JSONL traces
   for a single project. Each recorder manages its own session identifier and
   exposes helper methods like `execution()` and `observation()`.
3. **Update `Logger`** – retain its public methods but internally call the new
   components. Legacy per‑project log files were removed in Phase&nbsp;3 so only
   structured trace files are written.
4. **Use the facade** – other modules continue to instantiate `Logger` as
   before. No external API changes are required.

When implementing these pieces try to keep the logic concise. The purpose of
Phase&nbsp;1 is to enable new tracing behaviour without altering how DockaShell is
operated.
