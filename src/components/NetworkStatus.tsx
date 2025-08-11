import { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-hide offline alert after 10 seconds if back online
    const timer = setTimeout(() => {
      if (isOnline) {
        setShowOfflineAlert(false);
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, [isOnline]);

  if (!showOfflineAlert && isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {!isOnline ? (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <strong>No Internet Connection</strong>
            <br />
            Please check your network connection and try again.
          </AlertDescription>
        </Alert>
      ) : showOfflineAlert ? (
        <Alert className="shadow-lg border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Connection Restored</strong>
            <br />
            You're back online!
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

// Network troubleshooting tips component
export function NetworkTroubleshootingTips() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <h4 className="font-semibold mb-2">Connection Issues? Try these steps:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your internet connection</li>
            <li>Disable ad blockers or browser extensions</li>
            <li>Try refreshing the page</li>
            <li>Check if your firewall is blocking the site</li>
            <li>Try using a different browser or incognito mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
