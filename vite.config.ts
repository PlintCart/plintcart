import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "frame-ancestors 'self'",
      'X-Frame-Options': 'SAMEORIGIN', // Keeping for older browser compatibility
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
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
    chunkSizeWarningLimit: 300, // Warn for chunks larger than 300KB
    
    // Enable source maps for production debugging but make them external
    sourcemap: mode === 'production' ? 'hidden' : true,
    
    // CSS optimizations
    cssCodeSplit: true,
    cssMinify: true,
    
    // Additional build optimizations
    reportCompressedSize: true,
    
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
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
