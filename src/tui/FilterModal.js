import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export const FilterModal = ({ onClose, onApply, currentFilters }) => {
  // Available trace types
  const traceTypes = [
    { key: 'user', label: 'User', color: 'blue' },
    { key: 'agent', label: 'Agent', color: 'yellow' },
    { key: 'summary', label: 'Summary', color: 'green' },
    { key: 'command', label: 'Command', color: 'white' },
    { key: 'apply_diff', label: 'Apply Diff', color: 'cyan' },
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filters, setFilters] = useState(
    currentFilters || {
      user: true,
      agent: true,
      summary: true,
      command: true,
      apply_diff: true,
    }
  );

  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < traceTypes.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (input === ' ') {
      // Toggle checkbox for current item
      const currentType = traceTypes[selectedIndex];
      setFilters((prev) => ({
        ...prev,
        [currentType.key]: !prev[currentType.key],
      }));
    } else if (key.return) {
      // Apply filters
      onApply(filters);
    } else if (key.escape || input === 'q') {
      onClose();
    }
  });

  const enabledCount = Object.values(filters).filter(Boolean).length;
  const totalCount = traceTypes.length;

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      paddingLeft: 2,
      paddingRight: 2,
      paddingY: 1,
      width: 40,
    },
    React.createElement(
      Text,
      { bold: true, marginBottom: 1 },
      `Filter Trace Types (${enabledCount}/${totalCount})`
    ),

    // Trace type checkboxes
    ...traceTypes.map((traceType, index) => {
      const isSelected = index === selectedIndex;
      const isChecked = filters[traceType.key];
      const checkbox = isChecked ? '☑' : '☐';

      return React.createElement(
        Box,
        {
          key: traceType.key,
          marginBottom: index === traceTypes.length - 1 ? 1 : 0,
        },
        React.createElement(
          Text,
          {
            backgroundColor: isSelected ? 'blue' : undefined,
            color: isSelected ? 'white' : traceType.color,
          },
          `${isSelected ? '>' : ' '} ${checkbox} ${traceType.label}`
        )
      );
    }),

    // Help text
    React.createElement(
      Text,
      { dimColor: true, textAlign: 'center' },
      '[↑↓] Navigate  [Space] Toggle  [Enter] Apply  [Esc/q] Cancel'
    )
  );
};
