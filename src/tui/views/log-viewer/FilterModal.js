import React, { useState } from 'react';
import { useInput, Box, Text } from 'ink';
import { MultiSelect } from '@inkjs/ui';
import { useStdoutDimensions } from '../../hooks/useStdoutDimensions.js';
import { DEFAULT_FILTERS } from '../../utils/entry-utils.js';

/**
 * FilterModal using ink-ui MultiSelect with proper container width
 */
export const FilterModal = ({ onClose, onApply, currentFilters }) => {
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

  const [selectedValues, setSelectedValues] = useState(
    filtersToArray(currentFilters || DEFAULT_FILTERS)
  );

  const handleSubmit = (finalValues) => {
    const newFilters = arrayToFilters(finalValues);
    onApply(newFilters);
  };

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onClose();
    }
  });

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      height: terminalHeight,
      width: '100%',
      paddingX: 2,
      paddingY: 1,
    },
    React.createElement(
      Text,
      { bold: true, marginBottom: 2 },
      'DockaShell TUI - Filter Trace Types'
    ),
    React.createElement(
      Box,
      {
        flexGrow: 1,
        flexDirection: 'column',
        width: '100%',
      },
      React.createElement(MultiSelect, {
        options: traceTypes,
        defaultValue: selectedValues,
        onChange: setSelectedValues,
        onSubmit: handleSubmit,
        visibleOptionCount: 10,
      })
    ),
    React.createElement(
      Text,
      { dimColor: true, marginTop: 2 },
      '[↑↓] Navigate  [Space] Toggle  [Enter] Apply  [Esc/q] Cancel'
    )
  );
};
