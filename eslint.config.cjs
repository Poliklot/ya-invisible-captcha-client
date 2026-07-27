const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const globals = require('globals');

const sourceFiles = ['src/**/*.ts'];

module.exports = [
  {
    ignores: ['dist/**', 'package/**'],
  },
  {
    ...eslint.configs.recommended,
    files: sourceFiles,
  },
  ...tseslint.configs['flat/recommended'].map((config) => ({
    ...config,
    files: sourceFiles,
  })),
  {
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      sourceType: 'module',
    },
    rules: {
      'no-new': 'off',
      'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    },
  },
];
