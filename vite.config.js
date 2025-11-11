import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // ✅ Needed for alias resolution
import { VitePWA } from 'vite-plugin-pwa' // ✅ PWA plugin

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // auto-update the service worker
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Unique Foundation',
        short_name: 'UF App',
        description: 'Manage your platform easily',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // opens like a native app
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  // ✅ Add alias configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': {},
    global: 'globalThis',
  },

  server: {
    port: 3000,
    host: true,
  },

  build: {
    outDir: 'dist',
    target: 'es2017',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-modal'],
          utils: ['axios', 'date-fns'],
        },
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop()
          if (/png|jpe?g|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app'],
  },

  publicDir: 'public',
})
