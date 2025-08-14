import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PerformanceMonitor } from './components/PerformanceMonitor'

// Preload critical fonts
if (typeof window !== 'undefined') {
  const preloadFont = (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  };

  // Add your critical font preloads here
  // preloadFont('/fonts/your-critical-font.woff2');
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <>
    <PerformanceMonitor />
    <App />
  </>
);
