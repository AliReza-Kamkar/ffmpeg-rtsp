import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['src/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Set indentation to 2 spaces
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-extra-semi': ['off'],
      'object-curly-spacing': ['error', 'always'],
      'brace-style': ['error', 'stroustrup'],
      'linebreak-style': ['error', 'unix'],
      // Disable the no-explicit-any rule
      '@typescript-eslint/no-explicit-any': 'off',
      'no-multiple-empty-lines': ['error', {
        'max': 1,
        'maxEOF': 0
      }],
    }
  }
];
