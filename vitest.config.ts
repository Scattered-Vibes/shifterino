/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any, tsconfigPaths() as any],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.next/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mocks/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname),
      '@/lib': resolve(__dirname, './lib'),
      '@/components': resolve(__dirname, './components'),
      '@/ui': resolve(__dirname, './components/ui'),
      '@/types': resolve(__dirname, './types'),
      '@/app': resolve(__dirname, './app'),
      '@/hooks': resolve(__dirname, './hooks'),
      '@/styles': resolve(__dirname, './styles'),
      '@/api': resolve(__dirname, './api'),
      '@/test': resolve(__dirname, './__tests__/helpers')
    }
  }
})