import { describe, test } from 'node:test';
import assert from 'node:assert';
import { getEntryHeight } from '../src/tui/LogViewer.js';

const ensureVisible = (entries, terminalHeight, scrollOffset, index) => {
  if (entries.length === 0) return scrollOffset;
  let offset = scrollOffset;
  if (index < offset) {
    offset = index;
  } else {
    const availableHeight = terminalHeight - 3;
    let height = 0;
    for (let i = index; i >= offset; i--) {
      height += getEntryHeight(entries[i], i === index);
      if (height > availableHeight) {
        offset = i + 1;
        break;
      }
    }
  }
  offset = Math.min(Math.max(offset, 0), entries.length - 1);
  return offset;
};

const calculateVisible = (entries, terminalHeight, scrollOffset, selectedIndex) => {
  if (entries.length === 0) return { start: 0, end: 0 };
  const availableHeight = terminalHeight - 3;
  let height = 0;
  let end = scrollOffset;
  while (
    end < entries.length &&
    height + getEntryHeight(entries[end], end === selectedIndex) <= availableHeight
  ) {
    height += getEntryHeight(entries[end], end === selectedIndex);
    end++;
  }
  return { start: scrollOffset, end, height };
};

const initialOffset = (entries, terminalHeight, selectedIndex) => {
  let height = 0;
  let offset = selectedIndex;
  const availableHeight = terminalHeight - 3;
  while (
    offset >= 0 &&
    height + getEntryHeight(entries[offset], offset === selectedIndex) <= availableHeight
  ) {
    height += getEntryHeight(entries[offset], offset === selectedIndex);
    offset--;
  }
  offset = Math.max(0, Math.min(entries.length - 1, offset + 1));
  return offset;
};

describe('LogViewer visibility logic', () => {
  test('scroll offset clamps when entry exceeds viewport', () => {
    const entries = [{ height: 20 }];
    const off = initialOffset(entries, 10, 0);
    assert.strictEqual(off, 0);
  });

  test('visible entries remain complete while navigating', () => {
    const entries = [{ height: 3 }, { height: 5 }, { height: 3 }];
    const termHeight = 10;
    let selected = 2;
    let offset = initialOffset(entries, termHeight, selected);
    let vis = calculateVisible(entries, termHeight, offset, selected);
    assert.deepStrictEqual([vis.start, vis.end], [2, 3]);
    assert.ok(vis.height <= termHeight - 3);

    selected = 1;
    offset = ensureVisible(entries, termHeight, offset, selected);
    vis = calculateVisible(entries, termHeight, offset, selected);
    assert.deepStrictEqual([vis.start, vis.end], [1, 2]);
    assert.ok(vis.height <= termHeight - 3);

    selected = 0;
    offset = ensureVisible(entries, termHeight, offset, selected);
    vis = calculateVisible(entries, termHeight, offset, selected);
    assert.deepStrictEqual([vis.start, vis.end], [0, 1]);
    assert.ok(vis.height <= termHeight - 3);
  });
});
