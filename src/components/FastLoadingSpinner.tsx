// Super fast loading component with minimal overhead
import { memo } from 'react';

const FastLoadingSpinner = memo(() => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
));

FastLoadingSpinner.displayName = 'FastLoadingSpinner';

export { FastLoadingSpinner };
