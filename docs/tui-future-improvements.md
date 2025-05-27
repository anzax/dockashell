# TUI Future Improvements

## Completed

- [x] Track terminal width for dynamic content sizing
- [x] Improve multi-line command display with line indicators
- [x] Use full terminal width for better readability
- [x] Fix command truncation issues

## Future Enhancements

### 1. Syntax Highlighting

- Add syntax highlighting for commands based on shell syntax
- Highlight heredoc delimiters differently
- Color code different command types (git, npm, docker, etc.)

### 2. Search Functionality

- Add `/` key to search through trace entries
- Highlight search matches
- Navigate between search results with `n` and `N`

### 3. Filtering

- Filter by trace type (command, note, user, agent, summary)
- Filter by exit code (show only failed commands)
- Filter by time range

### 4. Export Options

- Export selected traces to file
- Copy command to clipboard
- Export as markdown report

### 5. Performance

- Virtual scrolling for very large trace lists
- Lazy loading of trace entries
- Incremental search/filter updates

### 6. Visual Improvements

- Add subtle animations for selection changes
- Better visual separation between entries
- Status bar with project info and stats
