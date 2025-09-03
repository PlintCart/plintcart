import { clearAllFirebaseCache, forceFirebaseRefresh } from "@/utils/clearCache";
import { Button } from "@/components/ui/button";

export const DebugCacheControls = () => {
  const handleClearCache = async () => {
    const confirmed = window.confirm(
      "This will clear ALL cached data and reload the page. Continue?"
    );
    
    if (confirmed) {
      await clearAllFirebaseCache();
      forceFirebaseRefresh();
    }
  };

  // Only show in development or when needed
  if (import.meta.env.PROD && !window.location.search.includes('debug=true')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-2 rounded-lg shadow-lg">
      <p className="text-xs mb-2">Debug Controls</p>
      <Button 
        onClick={handleClearCache}
        size="sm"
        variant="outline"
        className="text-xs bg-white text-red-600 hover:bg-red-50"
      >
        Clear All Cache & Reload
      </Button>
    </div>
  );
};
