import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'android/', 'node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { sourceType: 'module', globals: globals.browser }
  },
  {
    files: ['sw.js'],
    languageOptions: { sourceType: 'script', globals: globals.serviceworker }
  },
  {
    files: ['scripts/**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node }
  },
  {
    files: ['tests/**/*.js', '*.config.mjs', '*.config.js'],
    languageOptions: { sourceType: 'module', globals: { ...globals.node, ...globals.browser } }
  }
];
