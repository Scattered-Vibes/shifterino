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
      '@/app': resolve(__dirname, './app'),
      '@/components': resolve(__dirname, './components'),
      '@/ui': resolve(__dirname, './components/ui'),
      '@/lib': resolve(__dirname, './lib'),
      '@/types': resolve(__dirname, './types'),
      '@/hooks': resolve(__dirname, './lib/hooks'),
      '@/utils': resolve(__dirname, './lib/utils'),
      '@/styles': resolve(__dirname, './app/styles'),
      '@/api': resolve(__dirname, './app/api'),
      '@/test': resolve(__dirname, './__tests__'),
      '@/middleware': resolve(__dirname, './middleware'),
      '@/scheduling': resolve(__dirname, './lib/scheduling'),
      '@/validations': resolve(__dirname, './lib/validations'),
      '@/models': resolve(__dirname, './types/models'),
      '@/shared': resolve(__dirname, './types/shared'),
      '@/supabase': resolve(__dirname, './lib/supabase')
    }
  }
})