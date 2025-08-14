import { build } from 'vite';
import { resolve } from 'path';

// Bundle analyzer configuration
const analyzeBuild = async () => {
  console.log('🔍 Analyzing bundle size...');
  
  try {
    const result = await build({
      configFile: resolve('./vite.config.ts'),
      build: {
        write: false,
        rollupOptions: {
          external: [],
          output: {
            manualChunks: (id) => {
              // Analyze what's going into each chunk
              if (id.includes('node_modules')) {
                if (id.includes('react')) {
                  return 'react-vendor';
                }
                if (id.includes('firebase')) {
                  return 'firebase-vendor';
                }
                if (id.includes('@radix-ui')) {
                  return 'ui-vendor';
                }
                if (id.includes('lucide-react')) {
                  return 'icons-vendor';
                }
                return 'vendor';
              }
              
              if (id.includes('src/pages')) {
                return 'pages';
              }
              
              if (id.includes('src/components')) {
                return 'components';
              }
              
              return 'main';
            }
          }
        }
      }
    });

    if (result && 'output' in result) {
      console.log('\n📊 Bundle Analysis Results:');
      console.log('================================');
      
      const chunks = result.output.filter(chunk => chunk.type === 'chunk');
      const assets = result.output.filter(chunk => chunk.type === 'asset');
      
      // Sort by size descending
      chunks.sort((a, b) => b.code.length - a.code.length);
      
      console.log('\n🎯 JavaScript Chunks:');
      chunks.forEach(chunk => {
        const sizeKB = (chunk.code.length / 1024).toFixed(2);
        console.log(`  ${chunk.fileName}: ${sizeKB}KB`);
        
        if (chunk.modules) {
          const largeDeps = Object.entries(chunk.modules)
            .filter(([, info]) => info.renderedLength > 10000)
            .sort((a, b) => b[1].renderedLength - a[1].renderedLength)
            .slice(0, 5);
            
          if (largeDeps.length > 0) {
            console.log(`    Large dependencies:`);
            largeDeps.forEach(([module, info]) => {
              const moduleSizeKB = (info.renderedLength / 1024).toFixed(2);
              const moduleName = module.split('/').pop() || module;
              console.log(`      ${moduleName}: ${moduleSizeKB}KB`);
            });
          }
        }
      });
      
      console.log('\n🖼️  Assets:');
      assets.forEach(asset => {
        if (asset.source) {
          const sizeKB = (asset.source.length / 1024).toFixed(2);
          console.log(`  ${asset.fileName}: ${sizeKB}KB`);
        }
      });
      
      const totalSizeKB = chunks.reduce((sum, chunk) => sum + chunk.code.length, 0) / 1024;
      console.log(`\n📈 Total JS Bundle Size: ${totalSizeKB.toFixed(2)}KB`);
      
      // Performance recommendations
      console.log('\n💡 Performance Recommendations:');
      if (totalSizeKB > 500) {
        console.log('  ⚠️  Bundle size is large (>500KB). Consider:');
        console.log('     - Implementing more code splitting');
        console.log('     - Lazy loading heavy components');
        console.log('     - Removing unused dependencies');
      }
      
      const reactChunk = chunks.find(c => c.fileName.includes('react'));
      if (reactChunk && reactChunk.code.length > 200000) {
        console.log('  ⚠️  React vendor chunk is large. Consider updating dependencies.');
      }
      
    }
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
  }
};

analyzeBuild();
