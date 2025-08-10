import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');

  useEffect(() => {
    // Track successful payment
    console.log('Payment successful for product:', productId);
  }, [productId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your payment has been processed successfully. You will receive a confirmation email shortly.
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
            
            {productId && (
              <Button 
                variant="outline" 
                onClick={() => navigate(`/product/${productId}`)}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Product
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
