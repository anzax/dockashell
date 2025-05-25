import eslint from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      'logs/',
      '*.min.js',
      'examples/',
      'scripts/image/templates/',
    ],
  },

  // Base configuration for all JavaScript files
  eslint.configs.recommended,

  // Node.js globals and rules
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      ecmaVersion: 2024,
      sourceType: 'module',
    },

    plugins: {
      prettier: eslintPluginPrettier,
    },

    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // ESLint rules that work well with this project
      'no-console': 'off', // Allow console for CLI tools
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'comma-dangle': ['error', 'only-multiline'],

      // Project-specific preferences
      'no-process-exit': 'off', // CLI tools often use process.exit
      'no-sync': 'off', // Some file operations are intentionally synchronous
    },
  },

  // Test files configuration
  {
    files: ['**/*.test.js', 'test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-expressions': 'off', // Test assertions can be expressions
    },
  },

  // Apply Prettier config (must be last to override conflicting rules)
  eslintConfigPrettier,
];
