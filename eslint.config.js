import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default [
  {
    name: 'ignores',
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.output/**',
      '**/coverage/**',
      '**/public/**',
      '**/.vite/**'
    ]
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  ...vue.configs['flat/recommended'],

  // Make sure Vue SFCs are parsed correctly
  {
    name: 'vue-sfc-parser',
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  },

  // TS/JS defaults
  {
    name: 'project-defaults',
    files: ['**/*.{ts,tsx,js,jsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      // In TS projects, undefined vars/types should be handled by TS (vue-tsc/tsc)
      'no-undef': 'off',
      // keep noise low; formatting handled by Prettier or editor
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-empty': 'off',
      'no-unreachable': 'off',
      'no-misleading-character-class': 'off',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      // Vue rules: start permissive, tighten later
      'vue/require-toggle-inside-transition': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-useless-template-attributes': 'warn',
      'vue/multi-word-component-names': 'off'
    }
  },

  // Disable stylistic rules that conflict with Prettier
  prettier
]
