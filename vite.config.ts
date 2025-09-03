import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "frame-ancestors 'self'",
      'X-Frame-Options': 'SAMEORIGIN',
    },
    // Add MIME type handling for development
    middlewareMode: false,
    fs: {
      strict: true,
    },
  },
  plugins: [
    react(),
    // Enable gzip compression for production
    mode === 'production' && viteCompression({
      algorithm: 'gzip',
      threshold: 1024,
    }),
    // Enable brotli compression for production (better than gzip)
    mode === 'production' && viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    // Add bundle analyzer
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false, // Don't auto-open to speed up build
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Performance optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // More aggressive compression
        passes: 2,
        reduce_vars: true,
        reduce_funcs: true,
        hoist_funs: true,
        join_vars: true,
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      // Explicitly set the input to ensure proper entry point
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        // Much more granular code splitting for better caching and loading
        manualChunks: {
          // Split Firebase very granularly to load only what's needed
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'], 
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          
          // React ecosystem split
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          
          // UI components - split heavy Radix UI components
          'radix-core': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'radix-forms': ['@radix-ui/react-select', '@radix-ui/react-tabs'],
          'radix-feedback': ['@radix-ui/react-toast', '@radix-ui/react-tooltip'],
          
          // Icons and charts as separate chunks
          'icons': ['lucide-react'],
          'charts': ['recharts'],
          
          // Form libraries 
          'forms': ['react-hook-form', '@hookform/resolvers'],
          'validation': ['zod'],
          
          // Utility libraries
          'styling': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          'date-utils': ['date-fns'],
          
          // Supabase separate (if used)
          'supabase': ['@supabase/supabase-js'],
          
          // Heavy libraries that should load on demand
          'heavy-utils': ['html2canvas'],
        },
        
        // Optimize chunk names and sizes
        chunkFileNames: (chunkInfo) => {
          // Use contenthash for better caching
          return `assets/[name]-[hash].js`;
        },
        entryFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
      },
    },
    
    // Much stricter chunk size limits
    chunkSizeWarningLimit: 200, // Warn for chunks larger than 200KB (more aggressive)
    
    // Enable source maps for production debugging but make them external
    sourcemap: mode === 'production' ? false : true, // Disable sourcemaps in prod for smaller size
    
    // CSS optimizations
    cssCodeSplit: true,
    cssMinify: 'esbuild', // Faster CSS minification
    
    // Additional build optimizations
    reportCompressedSize: false, // Disable to speed up build
    
    // Optimize asset handling
    assetsInlineLimit: 2048, // Reduce inline limit to 2KB for smaller bundles
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts',
    ],
    // Exclude large libraries that should be code-split
    exclude: ['html2canvas'],
  },
}));
