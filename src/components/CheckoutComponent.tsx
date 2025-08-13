import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard, Truck, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { CheckoutData, OrderItem, MpesaPaymentResult } from '@/types/payment';
import { MpesaService, MpesaSettings } from '@/services/MpesaService';
import { toast } from 'sonner';

interface CheckoutComponentProps {
  items: OrderItem[];
  deliveryFee?: number;
  mpesaSettings: MpesaSettings;
  onOrderComplete: (orderId: string, orderData: CheckoutData) => void;
  onOrderCancel?: () => void;
}

export function CheckoutComponent({ 
  items, 
  deliveryFee = 0, 
  mpesaSettings, 
  onOrderComplete,
  onOrderCancel 
}: CheckoutComponentProps) {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash'>('mpesa');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<MpesaPaymentResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + deliveryFee;

  const validateForm = () => {
    if (!customerInfo.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (paymentMethod === 'mpesa' && !MpesaService.validatePhoneNumber(customerInfo.phone)) {
      toast.error('Please enter a valid M-Pesa phone number');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      const orderId = `ORDER-${Date.now()}`;
      const checkoutData: CheckoutData = {
        items,
        customerInfo,
        paymentMethod,
        deliveryFee,
        total,
        notes: notes.trim() || undefined
      };

      if (paymentMethod === 'mpesa' && mpesaSettings.enableMpesa) {
        // Use backend payment processing
        const paymentRequest = {
          phoneNumber: customerInfo.phone,
          amount: total,
          orderId,
          description: `Payment for order ${orderId}`,
          merchantSettings: mpesaSettings
        };

        const paymentResult = await MpesaService.initiatePayment(paymentRequest);
        
        if (paymentResult.success) {
          setPaymentResult({
            success: true,
            orderId,
            checkoutRequestId: paymentResult.transactionId,
            message: paymentResult.message,
            instructions: paymentResult.instructions
          });
        } else {
          throw new Error(paymentResult.message || 'Payment initiation failed');
        }
      } else {
        // Cash on delivery
        setPaymentResult({
          success: true,
          orderId,
          message: 'Order confirmed! You can pay cash on delivery.',
          instructions: 'Please have exact change ready when the delivery arrives.'
        });
      }

      // Call the completion handler
      onOrderComplete(orderId, checkoutData);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process order. Please try again.');
      setPaymentResult({
        success: false,
        orderId: '',
        message: 'Order processing failed. Please try again or contact support.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentResult) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentResult.success ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                Order Confirmed
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-red-600" />
                Order Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {paymentResult.message}
            </AlertDescription>
          </Alert>

          {paymentResult.success && paymentResult.orderId && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">Order ID: {paymentResult.orderId}</p>
              <p className="text-sm text-muted-foreground">Save this for your records</p>
            </div>
          )}

          {paymentResult.instructions && (
            <div className="space-y-2">
              <h4 className="font-medium">Payment Instructions:</h4>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{paymentResult.instructions}</pre>
              </div>
            </div>
          )}

          {paymentResult.checkoutRequestId && (
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Waiting for payment...</p>
                <p className="text-sm text-orange-700">Check your phone for the M-Pesa prompt</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {onOrderCancel && (
              <Button variant="outline" onClick={onOrderCancel} className="flex-1">
                Close
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()} 
              className="flex-1"
              variant={paymentResult.success ? "default" : "destructive"}
            >
              {paymentResult.success ? 'Place Another Order' : 'Try Again'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × KSh {item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">KSh {item.total.toFixed(2)}</p>
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>KSh {subtotal.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Delivery Fee
                </span>
                <span>KSh {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>KSh {total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Form */}
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-medium">Customer Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254712345678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full delivery address..."
                rows={3}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'mpesa' | 'cash')}>
              {mpesaSettings.enableMpesa && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <Label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="w-4 h-4 text-green-600" />
                    M-Pesa
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="w-4 h-4" />
                  Cash on Delivery
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleCheckout} 
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {paymentMethod === 'mpesa' ? (
                  <Smartphone className="w-4 h-4 mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Complete Order - KSh {total.toFixed(2)}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
