import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Providers } from './providers'

// Add loading indicator immediately
const showLoadingSpinner = () => {
  const root = document.getElementById('root');
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading application...</p>
      </div>
    `;
  }
};

// Show loading immediately
showLoadingSpinner();

// Optimize font loading with display=swap
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

  // Critical performance: defer non-critical scripts
  const deferNonCritical = () => {
    // Remove browser extension interference
    const removeExtensionScripts = () => {
      const extensionScripts = document.querySelectorAll('script[src*="chrome-extension"]');
      extensionScripts.forEach(script => script.remove());
    };
    
    setTimeout(removeExtensionScripts, 0);
  };
  
  deferNonCritical();
}

if (typeof window !== 'undefined') {
  // Detect if running inside a popup window
  if (window.opener && window.opener !== window) {
    // Redirect the opener window to the current location or /admin
    window.opener.location.href = window.location.href || '/admin';
    // Close the popup window
    window.close();
  }
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <Providers>
    <App />
  </Providers>
);
