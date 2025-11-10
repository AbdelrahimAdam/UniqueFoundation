import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],

  // Critical: Define global variables for Firebase and other libraries
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': {},
    global: 'globalThis',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Ensure single instance of React
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },

  server: {
    port: 3000,
    host: true, // Listen on all addresses
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Hot reload configuration
    hmr: {
      overlay: true,
    },
  },

  preview: {
    port: 3000,
    host: true,
  },

  build: {
    outDir: 'dist',
    target: 'es2017',
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    
    // Terser configuration for optimal production build
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },

    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1600,

    rollupOptions: {
      output: {
        // Optimized chunk splitting for better caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Firebase chunks
            if (id.includes('firebase/auth')) return 'firebase-auth'
            if (id.includes('firebase/firestore')) return 'firebase-firestore'
            if (id.includes('firebase/app')) return 'firebase-core'
            if (id.includes('firebase')) return 'firebase-other'
            
            // React chunks
            if (id.includes('react-dom')) return 'react-dom'
            if (id.includes('react')) return 'react-core'
            
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'ui-components'
            
            // Utilities
            if (id.includes('axios') || id.includes('date-fns')) return 'utils'
            
            // Internationalization
            if (id.includes('i18next')) return 'i18n'
            
            // Router
            if (id.includes('react-router')) return 'router'
            
            return 'vendor-other'
          }
        },
        
        // Optimized file naming for caching - CRITICAL FOR STATIC ASSETS
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').pop()
          // Handle images and icons properly
          if (/png|jpe?g|gif|tiff|bmp|ico|svg/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          // Handle fonts
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          // Handle CSS
          if (/css/i.test(extType)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          // Default for other assets
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },

  // Optimize dependencies for faster builds
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
  },

  // ESBuild configuration
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  // CSS configuration
  css: {
    devSourcemap: false,
  },

  // Public directory for static assets - CRITICAL FOR FAVICON
  publicDir: 'public',
})