# DockaShell Logging & Traces Design - Executive Summary

## The Problem
- Two log files with unclear purposes: `dockashell.jsonl` and `dockashell.log`
- Confusion about what goes where
- No clear distinction between system debugging and agent observability
- Missing features for scalability (sessions, trace IDs, etc.)

## The Solution

### 1. Clear Separation
**System Logs** (`~/.dockashell/logs/system.log`)
- For: DockaShell debugging and monitoring
- Format: Traditional text logs with levels
- Example: `[2025-05-24T10:00:00Z] ERROR Container startup failed: port already in use`

**Agent Traces** (`~/.dockashell/projects/{name}/traces/current.jsonl`)
- For: AI agent observability and memory
- Format: Structured JSONL with rich metadata
- Example: `{"id":"tr_abc123","tool":"run_command","command":"npm test","result":{"success":true}}`

### 2. Key Design Decisions

**Why "traces" instead of "logs"?**
- Traces imply structured, connected data for observability
- Logs imply unstructured, temporal debugging data
- This naming clarifies purpose immediately

**Why store traces per-project?**
- Agent activity is project-specific
- Enables project isolation and cleanup
- Supports future multi-agent scenarios

**Why add session management?**
- Prevents unbounded file growth
- Enables session replay and analysis
- Natural boundary for compression

### 3. Implementation Approach

**Phase 1: Lean Core**
- SystemLogger class for traditional logging
- TraceRecorder class for structured traces
- Facade pattern for backward compatibility
- Dual writing to both systems

**Phase 2: Migration**
- TUI migration

**Phase 3: Enhancement**
- Session compression
- Advanced querying
- Correlation tracking

### 4. Benefits

**For Developers**
- Clear debugging with system logs
- No more confusion about log purposes
- Easy to extend

**For AI Agents**
- Structured memory via traces
- Session continuity
- Rich metadata for learning

**For Users**
- Better observability of agent actions
- Powerful filtering and search
- Session replay capabilities

## Next Steps

1. Review the three design documents:
   - `01-LOGGING_TRACES_DESIGN.md` - Full specification
   - `02-LOGGING_COMPARISON.md` - Quick reference
   - `03-IMPLEMENTATION_PLAN.md` - Step-by-step guide

2. Start implementation with:
   - `src/system-logger.js` - Traditional logging
   - `src/trace-recorder.js` - Agent traces
   - Update `src/logger.js` as facade

3. Test with dual writing before full migration

This design provides clarity, scalability, and a solid foundation for future enhancements while keeping the implementation lean and pragmatic.
