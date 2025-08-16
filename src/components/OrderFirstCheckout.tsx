import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  Smartphone, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { addDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';
import { MpesaService } from '@/services/MpesaService';
import { toast } from 'sonner';

interface OrderFirstCheckoutProps {
  product: Product;
  businessSettings: any;
  mpesaSettings: any;
  onOrderComplete?: (orderId: string) => void;
  onCancel?: () => void;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface OrderStatus {
  orderId: string | null;
  status: 'creating' | 'created' | 'payment_pending' | 'payment_completed' | 'payment_failed';
  paymentMethod: 'mpesa' | 'cash' | null;
  paymentResult?: any;
}

export function OrderFirstCheckout({
  product,
  businessSettings,
  mpesaSettings,
  onOrderComplete,
  onCancel
}: OrderFirstCheckoutProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  
  const [orderStatus, setOrderStatus] = useState<OrderStatus>({
    orderId: null,
    status: 'creating',
    paymentMethod: null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showPaymentPendingDialog, setShowPaymentPendingDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const deliveryFee = businessSettings?.deliveryFee || 0;
  const total = product.price + deliveryFee;

  // Create stock transaction for sales analytics
  const createStockTransaction = async (orderId: string) => {
    try {
      const transaction = {
        userId: product.userId,
        productId: product.id,
        productName: product.name,
        type: 'sold',
        quantity: 1, // Always 1 for single product orders
        reason: `Order ${orderId}`,
        timestamp: new Date(),
        orderId: orderId,
        unitPrice: product.price,
        totalValue: product.price * 1
      };

      await addDoc(collection(db, 'stockTransactions'), transaction);
      console.log('Stock transaction created for analytics');
    } catch (error) {
      console.error('Error creating stock transaction:', error);
      // Don't show error to user as this is for analytics only
    }
  };

  // Step 1: Create order immediately with customer info
  const createOrder = async () => {
    if (!validateCustomerInfo()) return;

    setIsProcessing(true);
    setOrderStatus(prev => ({ ...prev, status: 'creating' }));

    try {
      const orderData = {
        businessOwnerId: product.userId,
        customerName: customerInfo.name.trim(),
        customerPhone: customerInfo.phone.trim(),
        customerEmail: customerInfo.email.trim() || null,
        customerAddress: customerInfo.address.trim() || null,
        items: [{
          name: product.name,
          quantity: 1,
          price: product.price,
          productId: product.id
        }],
        productName: product.name,
        productPrice: product.price,
        productId: product.id,
        subtotal: product.price,
        deliveryFee,
        total,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: null,
        currency: businessSettings?.currency || 'KES',
        notes: notes.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        message: `Order for ${product.name} by ${customerInfo.name}`
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      setOrderStatus({
        orderId: orderRef.id,
        status: 'created',
        paymentMethod: null
      });

      toast.success('Order created! Choose your payment method.');
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
      setOrderStatus(prev => ({ ...prev, status: 'creating' }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Process payment based on method chosen
  const processPayment = async (method: 'mpesa' | 'cash') => {
    if (!orderStatus.orderId) return;

    setIsProcessing(true);
    setOrderStatus(prev => ({ ...prev, paymentMethod: method, status: 'payment_pending' }));

    try {
      // Update order with payment method
      await updateDoc(doc(db, 'orders', orderStatus.orderId), {
        paymentMethod: method,
        updatedAt: new Date()
      });

      if (method === 'mpesa' && mpesaSettings.enableMpesa) {
        // Process M-Pesa payment using MpesaService
        try {
          const paymentRequest = {
            phoneNumber: customerInfo.phone,
            amount: total,
            orderId: orderStatus.orderId,
            description: `Payment for ${product.name}`,
            merchantSettings: mpesaSettings
          };

          const paymentResult = await MpesaService.initiatePayment(paymentRequest);
          
          if (paymentResult.success) {
            setOrderStatus(prev => ({ 
              ...prev, 
              status: 'payment_pending',
              paymentResult 
            }));
            
            // Update order with payment reference
            const updateData: any = {
              paymentStatus: 'pending',
              paymentMethod: 'mpesa',
              updatedAt: new Date()
            };
            
            if (paymentResult.transactionId) {
              updateData.paymentReference = paymentResult.transactionId;
            }
            
            if (paymentResult.instructions) {
              updateData.paymentInstructions = paymentResult.instructions;
            }
            
            await updateDoc(doc(db, 'orders', orderStatus.orderId), updateData);

            setShowPaymentConfirmation(true);
            toast.success('M-Pesa payment initiated! Check your phone.');
          } else {
            throw new Error(paymentResult.message || 'Payment failed');
          }
        } catch (error) {
          console.error('M-Pesa payment error:', error);
          toast.error('Payment failed. Please try again.');
          return;
        }
      } else {
        // Cash on delivery
        setOrderStatus(prev => ({ 
          ...prev, 
          status: 'payment_completed',
          paymentResult: {
            success: true,
            message: 'Order confirmed for Cash on Delivery'
          }
        }));
        
        await updateDoc(doc(db, 'orders', orderStatus.orderId), {
          paymentStatus: 'cod_pending', // Cash on delivery pending
          updatedAt: new Date()
        });

        // Create stock transaction for sales analytics (COD orders are confirmed immediately)
        await createStockTransaction(orderStatus.orderId);

        toast.success('Order confirmed! Pay cash on delivery.');
        onOrderComplete?.(orderStatus.orderId);
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setOrderStatus(prev => ({ ...prev, status: 'payment_failed' }));
      
      // Update order status
      if (orderStatus.orderId) {
        await updateDoc(doc(db, 'orders', orderStatus.orderId), {
          paymentStatus: 'failed',
          paymentError: error instanceof Error ? error.message : 'Payment failed',
          updatedAt: new Date()
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: Customer confirms payment (for M-Pesa)
  const confirmPayment = async (paid: boolean) => {
    if (!orderStatus.orderId) return;

    try {
      if (paid) {
        await updateDoc(doc(db, 'orders', orderStatus.orderId), {
          paymentStatus: 'paid',
          paymentConfirmedAt: new Date(),
          status: 'completed',
          updatedAt: new Date()
        });

        // Create stock transaction for sales analytics
        await createStockTransaction(orderStatus.orderId);

        setOrderStatus(prev => ({ ...prev, status: 'payment_completed' }));
        toast.success('Payment confirmed! Your order is being processed.');
        onOrderComplete?.(orderStatus.orderId);
      } else {
        await updateDoc(doc(db, 'orders', orderStatus.orderId), {
          paymentStatus: 'pending_confirmation',
          updatedAt: new Date()
        });

        // Show centered dialog instead of just toast
        setShowPaymentPendingDialog(true);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to update payment status');
    }
  };

  const validateCustomerInfo = () => {
    if (!customerInfo.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!customerInfo.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    return true;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'KES': 'KSh',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  // Render different steps based on order status
  if (orderStatus.status === 'creating') {
    return (
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">Quantity: 1</p>
              </div>
              <p className="font-medium">
                {getCurrencySymbol(businessSettings?.currency || 'KES')} {product.price.toFixed(2)}
              </p>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Delivery Fee</span>
                </div>
                <p>{getCurrencySymbol(businessSettings?.currency || 'KES')} {deliveryFee.toFixed(2)}</p>
              </div>
            )}
            
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>{getCurrencySymbol(businessSettings?.currency || 'KES')} {total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+254712345678"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address
              </Label>
              <Textarea
                id="address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your delivery address..."
                rows={3}
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
                rows={2}
                disabled={isProcessing}
              />
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={createOrder} 
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment method selection
  if (orderStatus.status === 'created') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Order Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Order ID: <strong>{orderStatus.orderId}</strong><br/>
                Customer: {customerInfo.name}<br/>
                Total: {getCurrencySymbol(businessSettings?.currency || 'KES')} {total.toFixed(2)}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">Choose Payment Method:</h4>
              
              <div className="space-y-3">
                {mpesaSettings.enableMpesa && (
                  <Button
                    onClick={() => processPayment('mpesa')}
                    disabled={isProcessing}
                    className="w-full justify-start h-auto p-4 text-left"
                    variant="outline"
                  >
                    <div className="flex items-center w-full">
                      <Smartphone className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">M-Pesa Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Pay instantly via M-Pesa STK Push
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2 flex-shrink-0">Recommended</Badge>
                    </div>
                  </Button>
                )}

                <Button
                  onClick={() => processPayment('cash')}
                  disabled={isProcessing}
                  className="w-full justify-start h-auto p-4 text-left"
                  variant="outline"
                >
                  <div className="flex items-center w-full">
                    <CreditCard className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Pay when your order is delivered
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment confirmation (M-Pesa)
  if (showPaymentConfirmation && orderStatus.paymentMethod === 'mpesa') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-green-600" />
              M-Pesa Payment Initiated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {orderStatus.paymentResult?.message || 'Check your phone for the M-Pesa payment prompt'}
              </AlertDescription>
            </Alert>

            {orderStatus.paymentResult?.instructions && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">Payment Instructions:</h4>
                <pre className="text-sm whitespace-pre-wrap">
                  {orderStatus.paymentResult.instructions}
                </pre>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-medium">Have you completed the payment?</h4>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => confirmPayment(true)}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Yes, I've Paid
                </Button>
                
                <Button
                  onClick={() => confirmPayment(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Not Yet / Having Issues
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Don't worry if you're having issues - your order is saved and you can complete payment later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment completed
  if (orderStatus.status === 'payment_completed') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Order Confirmed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Order ID:</strong> {orderStatus.orderId}<br/>
                <strong>Status:</strong> {orderStatus.paymentMethod === 'cash' ? 'Confirmed - Cash on Delivery' : 'Payment Confirmed'}<br/>
                <strong>Total:</strong> {getCurrencySymbol(businessSettings?.currency || 'KES')} {total.toFixed(2)}
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Your order is being processed</li>
                <li>• You'll receive updates via phone/SMS</li>
                <li>• Estimated delivery: 1-3 business days</li>
                {orderStatus.paymentMethod === 'cash' && (
                  <li>• Please have exact change ready for delivery</li>
                )}
              </ul>
            </div>

            <Button onClick={() => window.location.reload()} className="w-full">
              Place Another Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Payment Pending Dialog */}
      <Dialog open={showPaymentPendingDialog} onOpenChange={setShowPaymentPendingDialog}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">⏰</div>
            <h3 className="text-xl font-bold mb-4">Payment Pending</h3>
            <p className="text-muted-foreground mb-4">
              No worries! Your order has been saved successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You can complete the payment later or contact our support team for assistance.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setShowPaymentPendingDialog(false);
                  // Redirect to storefront
                  if (onOrderComplete) {
                    onOrderComplete(orderStatus.orderId || '');
                  } else {
                    // Fallback redirect
                    window.location.href = `/store/${product?.userId}`;
                  }
                }}
                className="w-full"
                style={{ backgroundColor: businessSettings?.primaryColor || '#059669' }}
              >
                ✅ Got it, go to store
              </Button>
              <p className="text-xs text-muted-foreground">
                Your order ID: {orderStatus.orderId}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {null}
    </>
  );
}
