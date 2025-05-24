# DockaShell Logging & Traces Implementation Plan

## Quick Start Implementation

### Step 1: Create Core Classes (Day 1)

#### 1.1 System Logger (`src/system-logger.js`)
```javascript
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class SystemLogger {
  constructor() {
    this.logsDir = path.join(os.homedir(), '.dockashell', 'logs');
    this.logFile = path.join(this.logsDir, 'system.log');
  }

  async log(level, message, context = {}) {
    await fs.ensureDir(this.logsDir);
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    const entry = `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${contextStr}\n`;
    await fs.appendFile(this.logFile, entry);
  }

  async debug(message, context) { await this.log('debug', message, context); }
  async info(message, context) { await this.log('info', message, context); }
  async warn(message, context) { await this.log('warn', message, context); }
  async error(message, error, context) {
    await this.log('error', message, { ...context, error: error.message, stack: error.stack });
  }
}

export const systemLogger = new SystemLogger();
```

#### 1.2 Trace Recorder (`src/trace-recorder.js`)
```javascript
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

export class TraceRecorder {
  constructor(projectName) {
    this.projectName = projectName;
    this.baseDir = path.join(os.homedir(), '.dockashell', 'projects', projectName, 'traces');
    this.currentFile = path.join(this.baseDir, 'current.jsonl');
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }

  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `ses_${timestamp}${random}`;
  }

  generateTraceId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `tr_${timestamp}${random}`;
  }

  async trace(tool, traceType, data) {
    await fs.ensureDir(this.baseDir);

    const entry = {
      id: this.generateTraceId(),
      session_id: this.sessionId,
      project_name: this.projectName,
      timestamp: new Date().toISOString(),
      elapsed_ms: Date.now() - this.sessionStart,
      tool,
      trace_type: traceType,
      ...data
    };

    await fs.appendFile(this.currentFile, JSON.stringify(entry) + '\n');
    return entry;
  }

  // Convenience methods
  async execution(tool, params, result) {
    return this.trace(tool, 'execution', { ...params, result });
  }

  async observation(type, text, metadata = {}) {
    return this.trace('write_trace', 'observation', { type, text, metadata });
  }

  async decision(operation, decision) {
    return this.trace('container_manager', 'decision', { operation, decision });
  }
}
```

### Step 2: Update Existing Code (Day 2)

#### 2.1 Modify Logger to be a Facade
```javascript
// src/logger.js - Keep for backward compatibility
import { systemLogger } from './system-logger.js';
import { TraceRecorder } from './trace-recorder.js';

export class Logger {
  constructor() {
    this.traceRecorders = new Map(); // projectName -> TraceRecorder
  }

  getTraceRecorder(projectName) {
    if (!this.traceRecorders.has(projectName)) {
      this.traceRecorders.set(projectName, new TraceRecorder(projectName));
    }
    return this.traceRecorders.get(projectName);
  }

  async logCommand(projectName, command, result) {
    // System log for debugging
    systemLogger.debug(`Command executed`, { projectName, command: command.substring(0, 50) });

    // Trace for observability
    const recorder = this.getTraceRecorder(projectName);
    await recorder.execution('run_command', { command }, {
      success: result.success,
      exit_code: result.exitCode,
      duration_ms: result.duration * 1000,
      stdout_preview: result.stdout?.substring(0, 200),
      stderr_preview: result.stderr?.substring(0, 200),
      output_truncated: result.stdout?.length > 200 || result.stderr?.length > 200,
      timed_out: result.timedOut
    });
  }

  async logNote(projectName, noteType, text) {
    const recorder = this.getTraceRecorder(projectName);
    await recorder.observation(noteType, text);
  }
}
```

#### 2.2 Update MCP Server Tools
```javascript
// In mcp-server.js, update the write_trace handler
{ 
  name: "write_trace",
  handler: async (args) => {
    const { project_name, type, text } = args;
    const recorder = logger.getTraceRecorder(project_name);
    await recorder.observation(type, text);
    return { success: true };
  }
}

// Replace read_log with new read_traces tool
{
  name: "read_traces",
  description: "Read agent activity traces",
  inputSchema: {
    type: "object",
    properties: {
      project_name: { type: "string" },
      tools: { type: "array", items: { type: "string" } },
      trace_types: { type: "array", items: { type: "string" } },
      limit: { type: "integer", default: 100 },
      offset: { type: "integer", default: 0 }
    },
    required: ["project_name"]
  },
  handler: async (args) => {
    const tracesFile = path.join(os.homedir(), '.dockashell', 'projects', args.project_name, 'traces', 'current.jsonl');

    if (!await fs.pathExists(tracesFile)) {
      return { traces: [], total: 0 };
    }

    const content = await fs.readFile(tracesFile, 'utf-8');
    let traces = content.trim().split('\n').map(line => JSON.parse(line));

    // Apply filters
    if (args.tools) {
      traces = traces.filter(t => args.tools.includes(t.tool));
    }
    if (args.trace_types) {
      traces = traces.filter(t => args.trace_types.includes(t.trace_type));
    }

    // Pagination
    const total = traces.length;
    traces = traces.slice(args.offset, args.offset + args.limit);

    return { traces, total };
  }
}
```

### Step 3: Minimal TUI Update (Day 3)

#### 3.1 Create Trace Viewer Component
```javascript
// src/tui/TraceViewer.js
import React from 'react';
import { Box, Text } from 'ink';

export const TraceViewer = ({ traces }) => {
  return (
    <Box flexDirection="column">
      {traces.map(trace => (
        <Box key={trace.id}>
          <Text color="grey">[{new Date(trace.timestamp).toLocaleTimeString()}]</Text>
          <Text> </Text>
          <Text color={getToolColor(trace.tool)}>{getToolEmoji(trace.tool)}</Text>
          <Text> </Text>
          <Text>{formatTrace(trace)}</Text>
        </Box>
      ))}
    </Box>
  );
};

function getToolEmoji(tool) {
  const emojis = {
    'run_command': '⚡',
    'write_trace': '📝',
    'start_project': '🚀',
    'container_manager': '🤔'
  };
  return emojis[tool] || '•';
}

function getToolColor(tool) {
  const colors = {
    'run_command': 'yellow',
    'write_trace': 'blue',
    'start_project': 'green',
    'container_manager': 'magenta'
  };
  return colors[tool] || 'white';
}

function formatTrace(trace) {
  if (trace.tool === 'run_command') {
    const status = trace.result?.success ? '✅' : '❌';
    return `${trace.command.substring(0, 50)} ${status}`;
  } else if (trace.tool === 'write_trace') {
    return `${trace.type.toUpperCase()}: ${trace.text.substring(0, 60)}`;
  }
  return JSON.stringify(trace);
}
```

### Step 4: Testing (Day 4)

#### 4.1 Test Trace Recorder
```javascript
// test/trace-recorder.test.js
import { TraceRecorder } from '../src/trace-recorder.js';
import fs from 'fs-extra';

describe('TraceRecorder', () => {
  let recorder;

  beforeEach(() => {
    recorder = new TraceRecorder('test-project');
  });

  afterEach(async () => {
    await fs.remove(recorder.baseDir);
  });

  test('generates unique trace IDs', async () => {
    const trace1 = await recorder.trace('test', 'execution', {});
    const trace2 = await recorder.trace('test', 'execution', {});
    expect(trace1.id).not.toBe(trace2.id);
  });

  test('includes all required fields', async () => {
    const trace = await recorder.execution('run_command',
      { command: 'ls' },
      { success: true }
    );

    expect(trace).toHaveProperty('id');
    expect(trace).toHaveProperty('session_id');
    expect(trace).toHaveProperty('timestamp');
    expect(trace).toHaveProperty('elapsed_ms');
    expect(trace.tool).toBe('run_command');
    expect(trace.trace_type).toBe('execution');
  });
});
```

## Migration Strategy

### Week 1: Dual Writing
1. Deploy new SystemLogger and TraceRecorder
2. Update Logger facade to write to both systems
3. Test thoroughly in development

### Week 2: Read Migration
1. Add read_traces tool
2. Update TUI to show traces (keep old log view)
3. Gather feedback

### Week 3: Cleanup
1. Remove old log format writing
2. Archive old logs
3. Update documentation

## Configuration

Create `~/.dockashell/config.json`:
```json
{
  "logging": {
    "system": {
      "level": "info"
    },
    "traces": {
      "compression": false,
      "session_timeout": "4h"
    }
  }
}
```

## Success Metrics

1. **No data loss** during migration
2. **TUI shows traces** within 5 seconds
3. **Trace queries** return in <100ms
4. **Session files** compress to <10% original size
5. **Zero impact** on existing functionality

## Next Steps

After basic implementation:
1. Add session management and compression
2. Implement correlation IDs
3. Add advanced filtering
4. Build session replay
5. Create trace analytics

This lean implementation provides immediate value while laying groundwork for future enhancements.
