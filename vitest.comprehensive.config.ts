import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'os';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    // Use threads for comprehensive tests
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: Math.max(1, Math.floor(os.cpus().length / 2)),
        minThreads: 1,
      },
    },
    isolate: false,
    cacheDir: 'node_modules/.vitest',
    testTimeout: 10000,
    hookTimeout: 10000,
    watch: false,
    // Only run comprehensive tests
    include: ['**/*.comprehensive.test.{ts,tsx}'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    env: {
      VITE_SUPABASE_TEST_URL: process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
      VITE_SUPABASE_TEST_ANON_KEY: process.env.VITE_SUPABASE_TEST_ANON_KEY || '',
      VITE_SUPABASE_TEST_SERVICE_KEY: process.env.VITE_SUPABASE_TEST_SERVICE_KEY || '',
    },
  },
});
