import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, ArrowLeft } from 'lucide-react';

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Order Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-muted-foreground mb-2">Your order has been placed successfully.</p>
            {orderId && (
              <p className="text-sm">
                Order ID: <span className="font-mono font-semibold">{orderId}</span>
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You will receive a confirmation message soon. Thank you for your purchase!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
