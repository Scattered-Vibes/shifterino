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
      'plugin:@typescript-eslint/recommended',
      'plugin:tailwindcss/recommended',
    ],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'tailwindcss/classnames-order': 'error',
      'tailwindcss/no-custom-classname': 'warn',
    },
  }),
]
