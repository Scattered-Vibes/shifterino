import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  ...compat.config({
    root: true,
    extends: [
      'next/core-web-vitals',
      'prettier',
      'plugin:@typescript-eslint/recommended',
      'plugin:tailwindcss/recommended',
    ],
    plugins: ['@typescript-eslint', 'tailwindcss'],
    parser: '@typescript-eslint/parser',
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@next/next/no-html-link-for-pages': 'off',
      'react/jsx-key': 'warn',
      'tailwindcss/classnames-order': 'error',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/enforces-shorthand': 'off',
      'tailwindcss/no-unnecessary-arbitrary-value': 'off'
    },
    settings: {
      tailwindcss: {
        callees: ['cn', 'cva'],
        config: './tailwind.config.ts'
      },
      next: {
        rootDir: true
      }
    }
  }),
]
