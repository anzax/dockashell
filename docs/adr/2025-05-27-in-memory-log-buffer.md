# ADR: In-Memory Log Buffer with React-Style UI State for Ink TUI

**Date:** 2025-05-27 **Status:** Proposed

## Context

We are building a terminal UI (TUI) using Ink (React-like for Node.js) to display a continuous stream of logs with filtering, search, and navigation capabilities. Logs arrive at high throughput (potentially thousands of lines per second), and the UI must remain responsive without unbounded memory growth or excessive CPU usage.

## Decision

Separate the ever-growing log stream from transient UI state by managing:

- **UI State** (filters, search terms, scroll position) in React via a `useReducer` + Context store.
- **Log Stream** in a fixed-size in-memory ring buffer held in a `useRef`, exposing only the visible slice to React components.

### Detailed Architecture

```
┌───────────────┐
│  Log Source   │  --append()--> (RingBuffer<String>)
└───────────────┘
                               │
                               │ snapshot of last N lines
                               ▼
                         ┌─────────────┐   UI Actions  ┌────────────────────┐
                         │ RingBuffer  │  --------->   │ useReducer Store   │
                         │ (useRef)    │               │ (UI State: filters,
                         └─────────────┘               │ search, scroll)
                               │                      └────────────────────┘
                               │ props
                               ▼
                     ┌─────────────────────────┐
                     │ Ink Components          │
                     │ - <Static> for history  │
                     │ - List of visible logs  │
                     │ - Filter/Search inputs  │
                     └─────────────────────────┘
```

- **Ring Buffer**: Cap at configurable size (e.g., 5,000 lines) to bound memory.
- **Repaints**: Trigger batched React updates by bumping a dummy state counter when new logs exceed a flush threshold.
- **UI Store**: Centralized reducer handles filter, search, and scroll actions; never processes log data directly.

## Consequences

- **Pros**:

  - Bounded memory usage regardless of log volume.
  - React diffing remains efficient, as only UI state triggers re-renders.
  - Clear separation of concerns between data buffering and UI logic.

- **Cons**:

  - Additional boilerplate for ring buffer management.
  - Need to coordinate flush timing to balance responsiveness and batching.

## Next Steps

1. Install and initialize a ring buffer library (e.g., `ringbufferjs`).
2. Implement `useRef`-based buffer and batched repaint logic.
3. Define UI reducer and Context provider for filters/search/navigation.
4. Integrate `<Static>` component for historical log rendering.
5. Measure performance under realistic log loads and adjust buffer/flush parameters.
