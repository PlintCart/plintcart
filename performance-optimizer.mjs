#!/usr/bin/env node

// Bundle optimization analyzer - provides actionable insights for performance improvements

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🚀 Running Performance Optimization Analysis...\n');

// 1. Build and analyze current bundle
console.log('1️⃣ Building optimized bundle...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build completed\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// 2. Analyze bundle composition
console.log('2️⃣ Analyzing bundle composition...');
try {
  const buildOutput = execSync('npm run build 2>&1', { encoding: 'utf8' });
  const chunks = [];
  const lines = buildOutput.split('\n');
  
  for (const line of lines) {
    if (line.includes('dist/assets/') && line.includes('.js') && !line.includes('.map')) {
      const match = line.match(/dist\/assets\/(.+?\.js)\s+(\d+\.?\d*\s*kB)/);
      if (match) {
        const [, filename, size] = match;
        const sizeNum = parseFloat(size.replace(/[^\d.]/g, ''));
        chunks.push({ filename, size: sizeNum, original: line.trim() });
      }
    }
  }
  
  chunks.sort((a, b) => b.size - a.size);
  
  console.log('📊 Largest JavaScript chunks:');
  chunks.slice(0, 10).forEach((chunk, i) => {
    const emoji = i < 3 ? '🔴' : i < 6 ? '🟠' : '🟡';
    console.log(`  ${emoji} ${chunk.filename}: ${chunk.size}KB`);
  });
  
  console.log('');
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
}

// 3. Performance recommendations
console.log('3️⃣ Performance Optimization Recommendations:\n');

const recommendations = [
  {
    priority: 'HIGH',
    action: 'Implement lazy loading for admin routes',
    impact: 'Reduce initial bundle by ~200KB',
    code: `// In App.tsx - wrap admin routes with lazy loading
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StockManagement = lazy(() => import('./pages/StockManagement'));`
  },
  {
    priority: 'HIGH', 
    action: 'Split Firebase services further',
    impact: 'Enable on-demand loading of Firebase features',
    code: `// Create separate chunks for Firebase auth vs Firestore
'firebase-auth': ['firebase/auth'],
'firebase-db': ['firebase/firestore'],
'firebase-storage': ['firebase/storage']`
  },
  {
    priority: 'MEDIUM',
    action: 'Implement component-level code splitting',
    impact: 'Reduce component bundle by ~50KB',
    code: `// Use dynamic imports for heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));`
  },
  {
    priority: 'MEDIUM',
    action: 'Add loading states and progressive enhancement',
    impact: 'Improve perceived performance',
    code: `// Show skeleton states while heavy components load
<Suspense fallback={<ComponentSkeleton />}>
  <HeavyComponent />
</Suspense>`
  },
  {
    priority: 'LOW',
    action: 'Tree shake unused dependencies',
    impact: 'Reduce vendor chunks by ~30KB',
    code: `// Use specific imports instead of barrel exports
import { Button } from '@/components/ui/button';
// Instead of: import * as UI from '@/components/ui';`
  }
];

recommendations.forEach((rec, i) => {
  const priorityEmoji = rec.priority === 'HIGH' ? '🔥' : rec.priority === 'MEDIUM' ? '⚡' : '💡';
  console.log(`${priorityEmoji} ${rec.priority} PRIORITY:`);
  console.log(`   Action: ${rec.action}`);
  console.log(`   Impact: ${rec.impact}`);
  console.log(`   Code: ${rec.code}`);
  console.log('');
});

// 4. Quick wins
console.log('4️⃣ Quick Performance Wins:\n');

const quickWins = [
  '✅ Enable gzip compression on your server',
  '✅ Add Cache-Control headers for static assets', 
  '✅ Use a CDN for faster global asset delivery',
  '✅ Implement service worker for offline caching',
  '✅ Add resource hints (preload, prefetch) for critical resources'
];

quickWins.forEach(win => console.log(win));

console.log('\n🎯 Target Metrics:');
console.log('   • First Contentful Paint (FCP): < 2s');
console.log('   • Largest Contentful Paint (LCP): < 2.5s');
console.log('   • Cumulative Layout Shift (CLS): < 0.1');
console.log('   • First Input Delay (FID): < 100ms');
console.log('   • Total Bundle Size: < 500KB gzipped');

console.log('\n📈 Next Steps:');
console.log('1. Implement lazy loading for admin routes (biggest impact)');
console.log('2. Split Firebase services into separate chunks');
console.log('3. Add Suspense boundaries with loading states');
console.log('4. Monitor Core Web Vitals in production');

console.log('\n🔧 Performance optimization analysis complete!');
