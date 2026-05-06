import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import css from '@eslint/css';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'node_modules/**', 'package-lock.json']
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,svelte}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    extends: [js.configs.recommended]
  },

  ...tseslint.configs.strict.map((config) => ({
    ...config,
    files: ['**/*.{ts,mts,cts,svelte}']
  })),
  ...tseslint.configs.stylistic.map((config) => ({
    ...config,
    files: ['**/*.{ts,mts,cts,svelte}']
  })),
  ...svelte.configs['flat/recommended'].map((config) =>
    config.rules && !config.files ? { ...config, files: ['**/*.svelte'] } : config
  ),

  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },

  {
    files: ['**/*.{ts,svelte}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-implicit-coercion': 'error',
      complexity: ['warn', { max: 12 }],
      'max-depth': ['warn', 3],
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 4],
      'no-else-return': 'warn',
      'no-lonely-if': 'warn',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForStatement',
          message: 'Prefer array helpers or Svelte {#each} blocks over classic for loops.'
        },
        {
          selector: 'ForInStatement',
          message: 'Prefer Object.keys/Object.entries helpers over for...in loops.'
        }
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      'svelte/button-has-type': 'error',
      'svelte/no-at-html-tags': 'warn',
      'svelte/no-inline-styles': 'error',
      'svelte/require-each-key': 'error',
      'svelte/require-store-reactive-access': 'error'
    }
  },

  {
    files: ['**/*.{ts,mts,cts,svelte}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }]
    }
  },

  {
    files: ['**/*.json'],
    ignores: ['tsconfig.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended']
  },

  {
    files: ['**/*.jsonc', 'tsconfig.json'],
    plugins: { json },
    language: 'json/jsonc',
    extends: ['json/recommended']
  },

  {
    files: ['**/*.md'],
    plugins: { markdown },
    language: 'markdown/gfm',
    extends: ['markdown/recommended']
  },

  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    extends: ['css/recommended'],
    rules: {
      'css/no-invalid-at-rules': 'off'
    }
  },

  prettier
]);
