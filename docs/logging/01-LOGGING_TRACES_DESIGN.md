# DockaShell Logging & Traces Design v2.0

## Overview

DockaShell maintains two distinct data streams with different purposes, formats, and lifecycles:

1. **System Logs** (`system.log`) - Traditional application logs for debugging and monitoring
2. **Agent Traces** (`traces.jsonl`) - Structured activity records for observability and memory

## Core Concepts

### System Logs
- **Purpose**: Debug errors, monitor health, track system events
- **Audience**: Developers maintaining DockaShell
- **Format**: Human-readable text with log levels
- **Location**: `~/.dockashell/logs/system.log`
- **Rotation**: Daily rotation, 7-day retention

### Agent Traces
- **Purpose**: AI agent observability, memory, knowledge distillation
- **Audience**: AI agents and users monitoring agent activity
- **Format**: Structured JSONL with rich metadata
- **Location**: `~/.dockashell/projects/{project_name}/traces/traces.jsonl`
- **Rotation**: Per-session files with compression

## File Organization

```
~/.dockashell/
├── logs/
│   ├── system.log          # Current system log
│   ├── system.2025-05-23.log  # Rotated logs
│   └── system.2025-05-22.log
├── projects/
│   └── {project_name}/
│       ├── config.json
│       ├── traces/
│       │   ├── current.jsonl    # Active session traces
│       │   ├── sessions/        # Completed sessions
│       │   │   ├── 2025-05-24T10-00-00Z_abc123.jsonl.gz
│       │   │   └── 2025-05-23T14-30-00Z_def456.jsonl.gz
│       │   └── index.json       # Session metadata index
│       └── state/
```

## Trace Entry Structure

### Base Fields (Present in ALL Traces)
```javascript
{
  // Identifiers
  "id": "tr_1a2b3c4d5e6f",              // Unique trace ID
  "session_id": "ses_abc123def456",     // Session identifier
  "project_name": "dockashell",         // Project context
  
  // Temporal
  "timestamp": "2025-05-24T10:00:00.123Z",  // High-precision ISO
  "elapsed_ms": 1234,                   // Time since session start
  
  // Source
  "tool": "run_command",                // MCP tool or component
  "trace_type": "execution",            // execution|observation|decision
  
  // Context (optional but recommended)
  "parent_id": "tr_parent123",          // For nested operations
  "correlation_id": "corr_xyz789",      // For related traces
  "tags": ["test", "validation"]        // Searchable tags
}
```

### Tool-Specific Fields

#### run_command Traces
```javascript
{
  ...base_fields,
  "tool": "run_command",
  "trace_type": "execution",
  "command": "npm test",
  "log": "Running tests to verify changes",
  "result": {
    "success": true,
    "exit_code": 0,
    "duration_ms": 2100,
    "stdout_preview": "All tests passed (17 suites)",  // First 200 chars
    "stderr_preview": "",
    "output_truncated": false,
    "timed_out": false
  }
}
```

#### write_trace Traces
```javascript
{
  ...base_fields,
  "tool": "write_trace",
  "trace_type": "observation",
  "type": "agent",  // agent|user|summary
  "text": "Analysis shows performance bottleneck in database queries",
  "metadata": {
    "importance": "high",
    "topics": ["performance", "database"]
  }
}
```

#### Decision Traces (Internal)
```javascript
{
  ...base_fields,
  "tool": "container_manager",
  "trace_type": "decision",
  "operation": "image_selection",
  "decision": {
    "chosen": "node:22-slim",
    "alternatives": ["node:22", "node:20-slim"],
    "reasoning": "Slim variant sufficient for JavaScript project"
  }
}
```

## Session Management

### Session Metadata
```javascript
// ~/.dockashell/projects/{project_name}/traces/index.json
{
  "sessions": [
    {
      "session_id": "ses_abc123def456",
      "started_at": "2025-05-24T10:00:00Z",
      "ended_at": "2025-05-24T11:30:00Z",
      "trace_count": 142,
      "command_count": 23,
      "error_count": 2,
      "summary": "Implemented authentication feature",
      "tags": ["feature", "auth"],
      "compressed_path": "sessions/2025-05-24T10-00-00Z_abc123.jsonl.gz"
    }
  ],
  "current_session": {
    "session_id": "ses_current789",
    "started_at": "2025-05-24T12:00:00Z",
    "trace_count": 15
  }
}
```

### Session Lifecycle

1. **Session Start**
   - Generate unique session ID
   - Create `current.jsonl`
   - Update index with session metadata

2. **During Session**
   - Append traces to `current.jsonl`
   - Update running statistics

3. **Session End** (On graceful shutdown or timeout)
   - Compress `current.jsonl` to `sessions/` directory
   - Update index with final metadata
   - Clear `current.jsonl`

## Implementation Details

### Logger Interface
```javascript
// System logging (traditional)
class SystemLogger {
  debug(message, context = {})
  info(message, context = {})
  warn(message, context = {})  
  error(message, error, context = {})
}

// Trace recording (structured)
class TraceRecorder {
  constructor(projectName, sessionId) 
  
  trace(tool, traceType, data) {
    const entry = {
      id: generateTraceId(),
      session_id: this.sessionId,
      project_name: this.projectName,
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - this.sessionStart,
      tool,
      trace_type: traceType,
      ...data
    }
    this.appendToFile(entry)
  }
  
  // Convenience methods
  execution(tool, params, result)
  observation(type, text, metadata)
  decision(operation, decision)
}
```

### Trace ID Generation
```javascript
// Simple but unique: timestamp + random
// Format: tr_<timestamp_base36><random>
function generateTraceId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 6)
  return `tr_${timestamp}${random}`
}

// Session IDs use similar pattern with ses_ prefix
```

### Query Interface
```javascript
// Enhanced write/read APIs
{
  tool: "read_traces",
  parameters: {
    project_name: "dockashell",
    session_id?: "ses_abc123",      // Filter by session
    tools?: ["run_command"],        // Filter by tools
    trace_types?: ["execution"],    // Filter by type
    tags?: ["test"],               // Filter by tags
    since?: "2025-05-24T10:00:00Z", // Time range
    until?: "2025-05-24T11:00:00Z",
    search?: "npm test",           // Full-text search
    limit?: 100,
    offset?: 0
  }
}
```

## Benefits

### Clear Separation of Concerns
- **System logs** for DockaShell health and debugging
- **Agent traces** for AI observability and memory

### Scalability Features
- **Session management** prevents unbounded file growth
- **Trace IDs** enable correlation and causality tracking
- **Project isolation** keeps traces with their context
- **Compression** reduces storage for historical data

### Enhanced Observability
- **Rich metadata** enables powerful queries
- **Trace types** distinguish different activities
- **Correlation IDs** link related operations
- **Tags** provide flexible categorization

### Future-Ready
- **Extensible schema** supports new trace types
- **Session concept** enables replay and analysis
- **Index files** allow fast session discovery
- **Standard format** enables external tool integration

## Migration Strategy

### Phase 1: Dual Writing (1 week)
- Keep existing logging
- Add TraceRecorder alongside
- Write to both systems

### Phase 2: Cutover (1 day)
- Switch TUI to read from traces
- Update all tools to use TraceRecorder
- Stop writing old format

### Phase 3: Cleanup (1 week)
- Archive old log files
- Remove old Logger code
- Update documentation

## Configuration

```javascript
// ~/.dockashell/config.json
{
  "logging": {
    "system": {
      "level": "info",
      "max_file_size": "10MB",
      "max_files": 7,
      "format": "text"  // or "json"
    },
    "traces": {
      "compression": true,
      "session_timeout": "4h",
      "max_session_size": "100MB",
      "retention_days": 30,
      "index_rebuild_interval": "1h"
    }
  }
}
```

## TUI Considerations

The TUI Log Viewer becomes a **Trace Viewer**:

```
┌─ DockaShell Traces ─────────────────────────┐
│ Session: ses_abc123 (2h 30m) | 142 traces   │
├─────────────────────────────────────────────┤
│ [10:00:01] 🚀 PROJECT Started 'dockashell'  │
│ [10:00:05] 📝 AGENT Planning implementation │
│ [10:00:08] ⚡ EXEC npm install             │
│            └─ ✅ Success in 2.1s           │
│ [10:00:12] 🤔 DECISION Selected node:22    │
│ [10:00:15] ⚡ EXEC npm test                │
│            └─ ❌ Failed: 3 tests failing   │
│ [10:00:18] 📝 AGENT Investigating failures │
└─────────────────────────────────────────────┘
```

Features:
- Filter by tool, type, or tags
- Show trace relationships (parent/correlation)
- Collapse/expand result details
- Session timeline visualization

## Summary

This design provides:

1. **Clear separation** between system logs and agent traces
2. **Proper naming** that reflects purpose (logs vs traces)
3. **Logical organization** with traces stored per-project
4. **Scalability features** including sessions, IDs, and compression
5. **Lean core** with room for future enhancements

The distinction between operational logging and agent activity tracing eliminates confusion while providing the right tool for each job.
