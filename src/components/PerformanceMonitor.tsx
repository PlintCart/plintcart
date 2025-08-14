import { useEffect } from 'react';

// Performance monitoring in development
export const PerformanceMonitor = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            console.log(`🔍 Performance: ${entry.name} took ${entry.duration}ms`);
          }
          
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            console.log('🚀 Performance Metrics:', {
              'DNS Lookup': nav.domainLookupEnd - nav.domainLookupStart,
              'TCP Connection': nav.connectEnd - nav.connectStart,
              'Request': nav.responseStart - nav.requestStart,
              'Response': nav.responseEnd - nav.responseStart,
              'DOM Content Loaded': nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
              'Total Load Time': nav.loadEventEnd - nav.startTime,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });

      // Monitor memory usage
      const checkMemory = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          console.log('💾 Memory Usage:', {
            'Used': `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
            'Total': `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
            'Limit': `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
          });
        }
      };

      const memoryInterval = setInterval(checkMemory, 30000); // Check every 30s

      return () => {
        observer.disconnect();
        clearInterval(memoryInterval);
      };
    }
  }, []);

  return null;
};

// HOC for component performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${componentName}-start`);
        
        return () => {
          performance.mark(`${componentName}-end`);
          performance.measure(
            `${componentName}-render`,
            `${componentName}-start`,
            `${componentName}-end`
          );
        };
      }
    }, []);

    return <WrappedComponent {...props} />;
  };
};
