import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false, // Disable service worker in development to avoid cache issues
      },
      includeAssets: ['icons/favicon.ico', 'icons/apple-touch-icon.png', 'icons/favicon-16x16.png', 'icons/favicon-32x32.png'],
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
            type: 'image/png'
          },
          {
            src: 'icons/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
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
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
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
          'supabase': ['@supabase/supabase-js'],
          'react-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          'date-utils': ['date-fns']
        }
      }
    },
    // Bundle size warning limit (KB) - alerts if chunks exceed this size
    chunkSizeWarningLimit: 600,
    // Enable sourcemaps for production error tracking (Sentry integration)
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    env: {
      // Test database configuration (Supabase Local)
      VITE_SUPABASE_TEST_URL: process.env.VITE_SUPABASE_TEST_URL || 'http://127.0.0.1:54321',
      VITE_SUPABASE_TEST_ANON_KEY: process.env.VITE_SUPABASE_TEST_ANON_KEY || '',
      VITE_SUPABASE_TEST_SERVICE_KEY: process.env.VITE_SUPABASE_TEST_SERVICE_KEY || '',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
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
    },
  },
})
