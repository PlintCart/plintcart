// Performance utilities for heavy components
import { ComponentType, ReactElement } from 'react';

// Lightweight loading component
export const ComponentLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-4">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  </div>
);

// Performance monitoring wrapper for heavy components
export const withPerformanceMonitor = <P extends object>(
  Component: ComponentType<P>,
  componentName: string
) => {
  return (props: P): ReactElement => {
    // Performance tracking
    const startTime = performance.now();
    
    // Log component render time
    setTimeout(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      if (renderTime > 16) { // Warn if rendering takes more than one frame
        console.warn(`🐌 ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
      }
    }, 0);

    return <Component {...props} />;
  };
};

// Create performance-monitored versions of heavy components
export const PerformanceMonitoredComponents = {
  // This will be imported dynamically where needed
  wrapComponent: withPerformanceMonitor,
  ComponentLoader,
};
