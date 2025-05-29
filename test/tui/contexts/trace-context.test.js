import { test, describe } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import {
  TraceProvider,
  useTraceSelection,
} from '../../../src/tui/contexts/trace-context.js';

describe('TraceContext', () => {
  test('should provide default values', () => {
    function TestComponent() {
      const { selectedIndex, selectedTimestamp, detailsState } =
        useTraceSelection();
      return React.createElement(
        Text,
        null,
        `${selectedIndex},${selectedTimestamp || 'null'},${detailsState ? 'open' : 'closed'}`
      );
    }

    const { lastFrame } = render(
      React.createElement(
        TraceProvider,
        null,
        React.createElement(TestComponent)
      )
    );

    assert.strictEqual(lastFrame(), '0,null,closed');
  });

  test('should provide context methods', () => {
    function TestComponent() {
      const context = useTraceSelection();
      const methods = [
        'selectedIndex',
        'setSelectedIndex',
        'scrollOffset',
        'setScrollOffset',
        'selectedTimestamp',
        'setSelectedTimestamp',
        'detailsState',
        'openDetails',
        'closeDetails',
        'navigateDetails',
        'restoreSelection',
      ];
      const hasAllMethods = methods.every(
        (method) => typeof context[method] !== 'undefined'
      );
      return React.createElement(
        Text,
        null,
        hasAllMethods ? 'all-methods-present' : 'missing-methods'
      );
    }

    const { lastFrame } = render(
      React.createElement(
        TraceProvider,
        null,
        React.createElement(TestComponent)
      )
    );

    assert.strictEqual(lastFrame(), 'all-methods-present');
  });

  test('should handle empty restore selection', () => {
    function TestComponent() {
      const { restoreSelection, selectedIndex } = useTraceSelection();

      React.useEffect(() => {
        // Test restore with empty array - should not crash
        restoreSelection([]);
        restoreSelection(null);
      }, [restoreSelection]);

      return React.createElement(Text, null, `index-${selectedIndex}`);
    }

    const { lastFrame } = render(
      React.createElement(
        TraceProvider,
        null,
        React.createElement(TestComponent)
      )
    );

    // Should not crash and maintain default index
    assert.strictEqual(lastFrame(), 'index-0');
  });
});
