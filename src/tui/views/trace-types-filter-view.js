import React, { useState } from 'react';
import { Text } from 'ink';
import { MultiSelect } from '@inkjs/ui';
import { useStdoutDimensions } from '../hooks/use-stdout-dimensions.js';
import { AppContainer } from '../components/app-container.js';
import { useStore } from '@nanostores/react';
import { DEFAULT_FILTERS } from '../ui-utils/entry-utils.js';
import { $traceFilters, setTraceFilters } from '../stores/filter-store.js';
import { Footer } from '../components/footer.js';
import { dispatch as uiDispatch } from '../stores/ui-store.js';

/**
 * Full screen trace type filter view using ink-ui MultiSelect.
 */
export const TraceTypesFilterView = () => {
  const [, terminalHeight] = useStdoutDimensions();

  const traceTypes = [
    { label: '👤 User', value: 'user' },
    { label: '🤖 Agent', value: 'agent' },
    { label: '📝 Summary', value: 'summary' },
    { label: '💻 Command', value: 'command' },
    { label: '🩹 Apply Patch', value: 'apply_patch' },
    { label: '📄 Write File', value: 'write_file' },
  ];

  const filtersToArray = (filterObj) => {
    return Object.entries(filterObj)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  };

  const arrayToFilters = (selectedArray) => {
    const newFilters = { ...DEFAULT_FILTERS };
    Object.keys(newFilters).forEach((key) => {
      newFilters[key] = false;
    });
    selectedArray.forEach((key) => {
      if (key in newFilters) {
        newFilters[key] = true;
      }
    });
    return newFilters;
  };

  const storeFilters = useStore($traceFilters);
  const [selectedValues, setSelectedValues] = useState(
    filtersToArray(storeFilters || DEFAULT_FILTERS)
  );

  const handleSubmit = (finalValues) => {
    const newFilters = arrayToFilters(finalValues);
    setTraceFilters(newFilters);
    uiDispatch({ type: 'set-view', view: 'log' });
  };

  return React.createElement(AppContainer, {
    header: React.createElement(
      Text,
      { bold: true },
      'DockaShell TUI - Filter Trace Types'
    ),
    footer: React.createElement(Footer),
    children: React.createElement(MultiSelect, {
      options: traceTypes,
      defaultValue: selectedValues,
      onChange: setSelectedValues,
      onSubmit: handleSubmit,
      visibleOptionCount: 10,
      height: terminalHeight - 4,
    }),
  });
};
