import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240,
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
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
      // Fix for buffer issues
      buffer: path.resolve(__dirname, './node_modules/buffer'),
      // Fix for stream issues
      stream: path.resolve(__dirname, './node_modules/stream-browserify'),
      // Fix for util issues
      util: path.resolve(__dirname, './node_modules/util'),
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
        pure_funcs: ['console.log', 'console.debug'], // Remove console logs
      },
      format: {
        comments: false,
      },
      mangle: {
        safari10: true,
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
            if (id.includes('@headlessui') || id.includes('@heroicons')) return 'ui-components'
            
            // Utilities
            if (id.includes('axios') || id.includes('date-fns') || id.includes('lodash')) return 'utils'
            
            // Internationalization
            if (id.includes('i18next')) return 'i18n'
            
            // Router
            if (id.includes('react-router')) return 'router'
            
            return 'vendor-other'
          }
          
          // Split src code by routes for better caching
          if (id.includes('src/pages') || id.includes('src/routes')) {
            const match = id.match(/src\/(pages|routes)\/([^\/]+)/)
            if (match) {
              return `route-${match[2]}`
            }
          }
        },
        
        // Optimized file naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css|scss|sass|less)$/.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          if (/\.(gif|jpe?g|png|svg|ico|webp)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
      
      // External dependencies that shouldn't be bundled
      external: [],
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
      'firebase/storage',
    ],
    exclude: [
      // Exclude dependencies that cause issues
    ],
  },

  // ESBuild configuration
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : [],
  },

  // CSS configuration
  css: {
    devSourcemap: false,
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
})