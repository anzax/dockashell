import { describe, test } from 'node:test';
import assert from 'node:assert';
import React, { useState } from 'react';
import { render } from 'ink-testing-library';
import { useVirtualList } from '../../src/tui/hooks/use-virtual-list.js';

describe('useVirtualList hook', () => {
  test('computes visible range and keeps selection in view', async () => {
    process.stdout.rows = 10;
    const items = Array.from({ length: 5 }, () => ({ height: 2 }));
    let list;
    const Test = () => {
      const [index, setIndex] = useState(0);
      const [offset, setOffset] = useState(0);
      list = useVirtualList({
        totalCount: items.length,
        getItem: (i) => items[i],
        getItemHeight: (it) => it.height,
        selectedIndex: index,
        scrollOffset: offset,
        onSelectionChange: setIndex,
        onScrollChange: setOffset,
      });
      return null;
    };
    render(React.createElement(Test));
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(list.visibleStart, 0);
    assert.strictEqual(list.visibleEnd, 3);
    list.setSelectedIndex(4);
    list.ensureVisible(4);
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(list.selectedIndex, 4);
    assert.strictEqual(list.visibleStart, 2);
    assert.strictEqual(list.visibleEnd, 5);
  });

  test('handles zero items', async () => {
    process.stdout.rows = 10;
    const items = [];
    let list;
    const Test = () => {
      const [index, setIndex] = useState(0);
      const [offset, setOffset] = useState(0);
      list = useVirtualList({
        totalCount: items.length,
        getItem: (i) => items[i],
        getItemHeight: () => 1,
        selectedIndex: index,
        scrollOffset: offset,
        onSelectionChange: setIndex,
        onScrollChange: setOffset,
      });
      return null;
    };
    render(React.createElement(Test));
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(list.visibleStart, 0);
    assert.strictEqual(list.visibleEnd, 0);
    assert.deepStrictEqual(list.visibleItems, []);
  });

  test('clamps out-of-range index in ensureVisible', async () => {
    process.stdout.rows = 10;
    const items = Array.from({ length: 3 }, () => ({ height: 1 }));
    let list;
    const Test = () => {
      const [index, setIndex] = useState(0);
      const [offset, setOffset] = useState(0);
      list = useVirtualList({
        totalCount: items.length,
        getItem: (i) => items[i],
        getItemHeight: () => 1,
        selectedIndex: index,
        scrollOffset: offset,
        onSelectionChange: setIndex,
        onScrollChange: setOffset,
      });
      return null;
    };
    render(React.createElement(Test));
    await new Promise((r) => setTimeout(r, 20));
    list.ensureVisible(10);
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(list.scrollOffset, 0);
    assert.strictEqual(list.visibleEnd, 3);
  });

  test('respects initial index and offset', async () => {
    process.stdout.rows = 10;
    const items = Array.from({ length: 10 }, () => ({ height: 1 }));
    let list;
    const Test = () => {
      const [index, setIndex] = useState(5);
      const [offset, setOffset] = useState(3);
      list = useVirtualList({
        totalCount: items.length,
        getItem: (i) => items[i],
        getItemHeight: () => 1,
        selectedIndex: index,
        scrollOffset: offset,
        onSelectionChange: setIndex,
        onScrollChange: setOffset,
      });
      return null;
    };
    render(React.createElement(Test));
    await new Promise((r) => setTimeout(r, 20));
    assert.strictEqual(list.selectedIndex, 5);
    assert.strictEqual(list.scrollOffset, 3);
  });
});
