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
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // Fixed for Google Auth
    },
    // Force correct MIME types
    middlewareMode: false,
    fs: {
      strict: true,
    },
    mime: {
      'application/javascript': ['js', 'mjs', 'jsx', 'ts', 'tsx']
    }
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
        // Aggressive code splitting for minimal initial bundle
        manualChunks: (id) => {
          // Critical path - keep minimal
          if (id.includes('react/') || id.includes('react-dom/')) {
            return 'react-core';
          }
          
          // Firebase - super granular splitting
          if (id.includes('firebase/app')) return 'firebase-core';
          if (id.includes('firebase/auth')) return 'firebase-auth';
          if (id.includes('firebase/firestore')) return 'firebase-firestore';
          if (id.includes('firebase/storage')) return 'firebase-storage';
          
          // Route-based splitting - admin routes separate
          if (id.includes('src/pages/Admin') || id.includes('src/pages/Stock') || id.includes('src/pages/Products')) {
            return 'admin-pages';
          }
          if (id.includes('src/pages/Dashboard') || id.includes('src/pages/Analytics')) {
            return 'dashboard-pages';
          }
          if (id.includes('src/pages/Payment') || id.includes('src/pages/Checkout')) {
            return 'payment-pages';
          }
          
          // Component-based splitting
          if (id.includes('src/components/ui/')) return 'ui-components';
          if (id.includes('@radix-ui/')) return 'radix-ui';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('recharts')) return 'charts';
          
          // Heavy utilities loaded on demand
          if (id.includes('html2canvas') || id.includes('jspdf')) return 'heavy-utils';
          
          // Everything else in vendor
          if (id.includes('node_modules')) return 'vendor';
          
          return 'main';
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
    
    // Explicit module format
    lib: undefined, // Ensure we're building an app, not a library
    outDir: 'dist',
    emptyOutDir: true,
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
