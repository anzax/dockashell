import React from 'react';
import { Text } from 'ink';
import Spinner from 'ink-spinner';

export const LoadingSpinner = ({ label, type = 'dots2' }) =>
  React.createElement(
    Text,
    null,
    React.createElement(Spinner, { type }),
    label ? ` ${label}` : ''
  );
