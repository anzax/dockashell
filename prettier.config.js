export default {
  // Formatting rules
  semi: true,
  singleQuote: true,
  quoteProps: 'consistent',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,

  // Line endings
  endOfLine: 'lf',

  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow functions
  arrowParens: 'always',

  // Prose wrapping (for markdown)
  proseWrap: 'always',

  // Markdown-specific settings
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: Infinity,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
  ],

  // Embedded languages
  embeddedLanguageFormatting: 'auto',
};
