import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ProductUploadDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Check what upload method is being used
    setDebugInfo({
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      location: window.location.href,
      buildMode: import.meta.env.MODE,
      environment: import.meta.env.PROD ? 'production' : 'development',
    });
  }, []);

  const testImageUpload = async () => {
    // Create a small test image
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#059669';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText('TEST', 35, 55);
    }

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          console.log('🧪 Testing base64 upload method...');
          const file = new File([blob], 'test.png', { type: 'image/png' });
          
          // Test base64 conversion
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          console.log('✅ Base64 conversion successful:', dataUrl.substring(0, 50) + '...');
          setDebugInfo(prev => ({
            ...prev,
            testResult: 'SUCCESS',
            testTime: new Date().toISOString(),
            dataUrlLength: dataUrl.length,
            method: 'base64-conversion'
          }));
        } catch (error) {
          console.error('❌ Base64 test failed:', error);
          setDebugInfo(prev => ({
            ...prev,
            testResult: 'FAILED',
            testError: error instanceof Error ? error.message : 'Unknown error',
            testTime: new Date().toISOString()
          }));
        }
      }
    }, 'image/png');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-lg">🔧 Upload Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Build Mode:</strong>
            <Badge variant={debugInfo.buildMode === 'production' ? 'default' : 'secondary'}>
              {debugInfo.buildMode || 'unknown'}
            </Badge>
          </div>
          <div>
            <strong>Environment:</strong>
            <Badge variant={debugInfo.environment === 'production' ? 'default' : 'secondary'}>
              {debugInfo.environment || 'unknown'}
            </Badge>
          </div>
          <div className="col-span-2">
            <strong>Location:</strong> {debugInfo.location}
          </div>
          <div className="col-span-2">
            <strong>Timestamp:</strong> {debugInfo.timestamp}
          </div>
          {debugInfo.testResult && (
            <>
              <div>
                <strong>Test Result:</strong>
                <Badge variant={debugInfo.testResult === 'SUCCESS' ? 'default' : 'destructive'}>
                  {debugInfo.testResult}
                </Badge>
              </div>
              <div>
                <strong>Method:</strong> {debugInfo.method || 'unknown'}
              </div>
              {debugInfo.dataUrlLength && (
                <div>
                  <strong>Data URL Length:</strong> {debugInfo.dataUrlLength.toLocaleString()} chars
                </div>
              )}
              {debugInfo.testError && (
                <div className="col-span-2 text-red-600">
                  <strong>Error:</strong> {debugInfo.testError}
                </div>
              )}
            </>
          )}
        </div>
        
        <Button onClick={testImageUpload} variant="outline" className="w-full">
          🧪 Test Image Upload Method
        </Button>
        
        <div className="text-xs text-muted-foreground">
          This debug panel helps identify if the base64 upload method is working correctly.
          If you see Firebase Storage errors, it means old cached code is still running.
        </div>
      </CardContent>
    </Card>
  );
}
