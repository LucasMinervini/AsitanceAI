import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// La frontera entre capas se hace cumplir aqui (regla de dependencia hacia adentro):
// domain -> no importa nada;  application -> no importa adapters/infrastructure.
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-web/**',
      'coverage/**',
      'node_modules/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'babel.config.js',
      'metro.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '**/application/**',
            '**/adapters/**',
            '**/infrastructure/**',
            '@application/*',
            '@adapters/*',
            '@infrastructure/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/adapters/**', '**/infrastructure/**', '@adapters/*', '@infrastructure/*'],
        },
      ],
    },
  },
);
