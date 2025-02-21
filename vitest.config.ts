/// <reference types="vitest" />
import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import type { InlineConfig } from 'vitest';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

interface VitestConfigExport extends UserConfig {
  test: InlineConfig;
}

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': resolve(__dirname),
      '@/test': resolve(__dirname, '__tests__/helpers'),
      '@/mocks': resolve(__dirname, '__tests__/mocks'),
      '@/components': resolve(__dirname, 'components'),
      '@/lib': resolve(__dirname, 'lib'),
      '@/types': resolve(__dirname, 'types'),
      '@/app': resolve(__dirname, 'app'),
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: [
      './vitest.setup.ts',
      './vitest.setup.mocks.ts',
      './__tests__/helpers/setup.ts'
    ],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
      ],
    },
  },
} as VitestConfigExport);