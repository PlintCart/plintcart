import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');

  useEffect(() => {
    // Track cancelled payment
    console.log('Payment cancelled for product:', productId);
  }, [productId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Payment Cancelled</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your payment was cancelled. No charges have been made to your account. 
            You can try again or choose a different payment method.
          </p>
          
          <div className="space-y-2">
            {productId && (
              <Button 
                onClick={() => navigate(`/product/${productId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Payment Again
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
