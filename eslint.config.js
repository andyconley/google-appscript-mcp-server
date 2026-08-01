import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['node_modules/**', 'demo/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        fetch: 'readonly',
        AbortSignal: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Opinionated newer rules relaxed to warnings so they flag inherited
      // codegen without blocking CI; real correctness rules stay as errors.
      'preserve-caught-error': 'off',
      'no-async-promise-executor': 'warn',
      'no-useless-assignment': 'warn'
    }
  },
  prettier
];
