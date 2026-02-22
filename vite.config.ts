import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import os from 'os';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon.ico',
        'icons/apple-touch-icon.png',
        'icons/favicon-16x16.png',
        'icons/favicon-32x32.png',
      ],
      manifest: {
        name: 'WFM - Workforce Management',
        short_name: 'WFM',
        description: 'Workforce Management System for shift swaps and leave requests',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
          },
          {
            src: 'icons/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: 'icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Clean up outdated caches automatically on new deployment
        cleanupOutdatedCaches: true,
        // Activate new service worker immediately
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'react-vendor-2': ['react/jsx-runtime'],
          supabase: ['@supabase/supabase-js'],
          'react-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'date-utils': ['date-fns'],
        },
      },
    },
    // Bundle size warning limit (KB) - alerts if chunks exceed this size
    chunkSizeWarningLimit: 600,
    // Enable sourcemaps for production error tracking (Sentry integration)
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Disable CSS processing in tests for better performance
    css: false,
    // Use threads pool for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: os.cpus().length,
        minThreads: 1,
        singleThread: false,
      },
    },
    // Disable isolation for 3-5x speed improvement
    // Tests must be independent and clean up after themselves
    isolate: false,
    // Cache test results for faster re-runs
    cacheDir: 'node_modules/.vitest',
    // Reduce test timeout to catch hanging tests
    testTimeout: 5000,
    hookTimeout: 5000,
    // Run tests in sequence to reduce memory overhead
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    // Limit concurrent tests
    maxConcurrency: 5,
    // Optimize file watching
    watch: false,
    // Exclude comprehensive tests by default
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/*.comprehensive.test.{ts,tsx}',
    ],
    // Reduce overhead from environment setup
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    env: {
      // Test database configuration (Supabase Local)
      VITE_SUPABASE_TEST_URL: process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
      VITE_SUPABASE_TEST_ANON_KEY: process.env.VITE_SUPABASE_TEST_ANON_KEY || '',
      VITE_SUPABASE_TEST_SERVICE_KEY: process.env.VITE_SUPABASE_TEST_SERVICE_KEY || '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/vite-env.d.ts',
        'vite.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'eslint.config.js',
      ],
      // Disable coverage during regular test runs for better performance
      enabled: false,
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
        // Per-layer coverage thresholds
        'src/hooks/**': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/lib/**': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/components/**': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      clean: true,
      reportsDirectory: './coverage',
    },
  },
} as UserConfig);
