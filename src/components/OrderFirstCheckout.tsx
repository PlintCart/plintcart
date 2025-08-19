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
import { getCurrencySymbol } from '@/lib/utils';
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
  status: 'creating' | 'created' | 'pending_payment' | 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'confirmed' | 'cancelled';
  paymentMethod: 'mpesa' | 'cash' | null;
  paymentResult?: any;
  accountNumber?: string;
  transactionId?: string;
  retryCount?: number;
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
    paymentMethod: null,
    retryCount: 0
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentTimer, setPaymentTimer] = useState(0);
  const [showRetryOptions, setShowRetryOptions] = useState(false);

  // Generate unique account number for order
  const generateAccountNumber = (orderId: string): string => {
    // Use merchant's preferred format or default to MM + random
    const prefix = businessSettings?.accountPrefix || 'MM';
    const suffix = orderId.slice(-5).toUpperCase();
    return `${prefix}${suffix}`;
  };

  // Generate order reference for better tracking
  const generateOrderReference = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  };
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
      const orderReference = generateOrderReference();
      
      // Ensure all values are properly defined to avoid Firestore errors
      const safeCustomerEmail = customerInfo.email?.trim() || null;
      const safeCustomerAddress = customerInfo.address?.trim() || null;
      const safeNotes = notes?.trim() || null;
      const safeCurrency = businessSettings?.currency || 'KES';
      const safeBusinessName = businessSettings?.businessName || businessSettings?.storeName || 'Store';
      const safeDeliveryFee = Number(deliveryFee) || 0;
      const safeTotal = Number(total) || Number(product.price) || 0;
      const safeUserAgent = navigator?.userAgent?.substring(0, 200) || 'Unknown';
      
      const orderData = {
        // Order tracking
        orderReference,
        businessOwnerId: product.userId || '',
        
        // Customer information
        customerName: customerInfo.name?.trim() || '',
        customerPhone: customerInfo.phone?.trim() || '',
        customerEmail: safeCustomerEmail,
        customerAddress: safeCustomerAddress,
        
        // Order items
        items: [{
          name: product.name || '',
          quantity: 1,
          price: Number(product.price) || 0,
          productId: product.id || ''
        }],
        productName: product.name || '',
        productPrice: Number(product.price) || 0,
        productId: product.id || '',
        subtotal: Number(product.price) || 0,
        deliveryFee: safeDeliveryFee,
        total: safeTotal,
        
        // Order status - Enhanced
        status: 'pending_payment',
        paymentStatus: 'awaiting_payment',
        paymentMethod: null,
        
        // Additional tracking fields
        currency: safeCurrency,
        notes: safeNotes,
        businessName: safeBusinessName,
        
        // Enhanced timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Additional metadata
        source: 'storefront',
        platform: 'web',
        userAgent: safeUserAgent,
        
        message: `Order for ${product.name || 'Product'} by ${customerInfo.name?.trim() || 'Customer'}`
      };

      console.log('Creating order with safe data:', orderData);
      
      // Validate that no undefined values exist before sending to Firestore
      const hasUndefined = Object.entries(orderData).some(([key, value]) => {
        if (value === undefined) {
          console.error(`Undefined value found for key: ${key}`);
          return true;
        }
        if (Array.isArray(value)) {
          return value.some(item => {
            if (typeof item === 'object' && item !== null) {
              return Object.values(item).some(v => v === undefined);
            }
            return item === undefined;
          });
        }
        return false;
      });

      if (hasUndefined) {
        throw new Error('Order data contains undefined values');
      }
      
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Generate account number based on order ID and merchant settings
      const accountNumber = generateAccountNumber(orderRef.id);
      
      // Update order with account number
      await updateDoc(doc(db, 'orders', orderRef.id), {
        accountNumber,
        updatedAt: new Date()
      });
      
      setOrderStatus({
        orderId: orderRef.id,
        status: 'pending_payment',
        paymentMethod: null,
        accountNumber,
        retryCount: 0
      });

      toast.success(`Order ${orderReference} created! Choose your payment method.`);
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
      setOrderStatus(prev => ({ ...prev, status: 'creating' }));
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Process payment based on method chosen - Enhanced with STK Push
  const processPayment = async (method: 'mpesa' | 'cash') => {
    if (!orderStatus.orderId) return;

    setIsProcessing(true);
    setOrderStatus(prev => ({ 
      ...prev, 
      paymentMethod: method, 
      status: 'payment_initiated' 
    }));

    try {
      // Update order with payment method
      await updateDoc(doc(db, 'orders', orderStatus.orderId), {
        paymentMethod: method,
        paymentStatus: method === 'mpesa' ? 'initiating_stk' : 'cod_confirmed',
        updatedAt: new Date()
      });

      if (method === 'mpesa' && mpesaSettings.enableMpesa) {
        // Process M-Pesa payment using enhanced MpesaService
        try {
          // Validate phone number first
          if (!MpesaService.validatePhoneNumber(customerInfo.phone)) {
            throw new Error('Invalid phone number format. Please use format: 0712345678 or 254712345678');
          }

          const formattedPhone = MpesaService.formatPhoneNumber(customerInfo.phone);
          
          const paymentRequest = {
            phoneNumber: formattedPhone,
            amount: total,
            orderId: orderStatus.orderId,
            description: `Payment for ${product.name} - Order ${orderStatus.accountNumber}`,
            merchantSettings: mpesaSettings
          };

          console.log('Initiating STK Push with:', paymentRequest);
          
          const paymentResult = await MpesaService.initiatePayment(paymentRequest);
          
          if (paymentResult.success) {
            // STK Push initiated successfully
            setOrderStatus(prev => ({ 
              ...prev, 
              status: 'payment_initiated',
              paymentResult,
              transactionId: paymentResult.transactionId
            }));
            
            // Update order with payment reference and start timer
            const updateData: any = {
              paymentStatus: 'stk_initiated',
              paymentMethod: 'mpesa',
              updatedAt: new Date(),
              stkInitiatedAt: new Date()
            };
            
            if (paymentResult.transactionId) {
              updateData.paymentReference = paymentResult.transactionId;
              updateData.checkoutRequestId = paymentResult.transactionId;
            }
            
            if (paymentResult.instructions) {
              updateData.paymentInstructions = paymentResult.instructions;
            }
            
            await updateDoc(doc(db, 'orders', orderStatus.orderId), updateData);

            // Show payment confirmation with timer
            setShowPaymentConfirmation(true);
            setPaymentTimer(300); // 5 minutes timeout
            
            // Start payment verification timer
            startPaymentVerification();
            
            toast.success('STK Push sent to your phone! Check your M-Pesa menu.');
          } else {
            throw new Error(paymentResult.message || 'STK Push failed');
          }
        } catch (error) {
          console.error('M-Pesa payment error:', error);
          
          // Increment retry count
          const newRetryCount = (orderStatus.retryCount || 0) + 1;
          setOrderStatus(prev => ({ 
            ...prev, 
            status: 'payment_failed',
            retryCount: newRetryCount
          }));
          
          // Update order with failure info
          await updateDoc(doc(db, 'orders', orderStatus.orderId), {
            paymentStatus: 'stk_failed',
            paymentError: error instanceof Error ? error.message : 'STK Push failed',
            retryCount: newRetryCount,
            updatedAt: new Date()
          });
          
          // Show retry options if under limit
          if (newRetryCount < 3) {
            setShowRetryOptions(true);
            toast.error(`Payment failed. ${error instanceof Error ? error.message : 'Please try again.'}`);
          } else {
            toast.error('Payment failed multiple times. Please contact support or try Cash on Delivery.');
          }
          return;
        }
      } else {
        // Cash on delivery - immediate confirmation
        setOrderStatus(prev => ({ 
          ...prev, 
          status: 'confirmed',
          paymentResult: {
            success: true,
            message: 'Order confirmed for Cash on Delivery'
          }
        }));
        
        await updateDoc(doc(db, 'orders', orderStatus.orderId), {
          paymentStatus: 'cod_confirmed',
          status: 'confirmed',
          confirmedAt: new Date(),
          updatedAt: new Date()
        });

        // Create stock transaction for sales analytics
        await createStockTransaction(orderStatus.orderId);

        toast.success('Order confirmed! You will pay cash on delivery.');
        
        // Send confirmation (you can add WhatsApp/Email service here)
        sendOrderConfirmation(orderStatus.orderId, 'cod');
        
        onOrderComplete?.(orderStatus.orderId);
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed. Please try again.');
      
      setOrderStatus(prev => ({ 
        ...prev, 
        status: 'payment_failed',
        retryCount: (prev.retryCount || 0) + 1
      }));
      
      // Update order status
      if (orderStatus.orderId) {
        await updateDoc(doc(db, 'orders', orderStatus.orderId), {
          paymentStatus: 'failed',
          paymentError: error instanceof Error ? error.message : 'Payment processing failed',
          updatedAt: new Date()
        });
      }
      
      setShowRetryOptions(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment verification with timer
  const startPaymentVerification = () => {
    const checkInterval = setInterval(async () => {
      if (!orderStatus.orderId) {
        clearInterval(checkInterval);
        return;
      }

      try {
        // Check payment status from backend
        const statusResult = await MpesaService.checkPaymentStatus(orderStatus.orderId);
        
        if (statusResult.success && statusResult.status === 'completed') {
          // Payment verified successfully
          clearInterval(checkInterval);
          
          setOrderStatus(prev => ({ 
            ...prev, 
            status: 'payment_completed'
          }));
          
          await updateDoc(doc(db, 'orders', orderStatus.orderId), {
            paymentStatus: 'completed',
            status: 'confirmed',
            paymentCompletedAt: new Date(),
            updatedAt: new Date()
          });
          
          // Create stock transaction
          await createStockTransaction(orderStatus.orderId);
          
          toast.success('Payment received! Your order is confirmed.');
          sendOrderConfirmation(orderStatus.orderId, 'mpesa');
          onOrderComplete?.(orderStatus.orderId);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      }
      
      // Decrease timer
      setPaymentTimer(prev => {
        if (prev <= 1) {
          clearInterval(checkInterval);
          // Payment timeout
          handlePaymentTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000); // Check every second
  };

  // Handle payment timeout
  const handlePaymentTimeout = async () => {
    if (!orderStatus.orderId) return;
    
    setOrderStatus(prev => ({ 
      ...prev, 
      status: 'payment_failed'
    }));
    
    await updateDoc(doc(db, 'orders', orderStatus.orderId), {
      paymentStatus: 'timeout',
      paymentError: 'Payment timeout - no payment received within 5 minutes',
      updatedAt: new Date()
    });
    
    setShowRetryOptions(true);
    toast.error('Payment timeout. No payment detected within 5 minutes.');
  };

  // Retry STK Push
  const retryPayment = async () => {
    if (!orderStatus.orderId || (orderStatus.retryCount || 0) >= 3) {
      toast.error('Maximum retry attempts reached. Please contact support.');
      return;
    }
    
    setShowRetryOptions(false);
    setShowPaymentConfirmation(false);
    
    // Reset status and retry
    setOrderStatus(prev => ({ 
      ...prev, 
      status: 'pending_payment',
      retryCount: (prev.retryCount || 0) + 1
    }));
    
    // Retry payment
    await processPayment('mpesa');
  };

  // Send order confirmation (placeholder - integrate with WhatsApp/Email service)
  const sendOrderConfirmation = async (orderId: string, paymentMethod: 'mpesa' | 'cod') => {
    try {
      // This would integrate with your WhatsApp/Email service
      console.log(`Sending confirmation for order ${orderId} via ${paymentMethod}`);
      
      // Example: Send WhatsApp message to business owner
      const message = `New order received! 
Order: ${orderStatus.accountNumber}
Customer: ${customerInfo.name} (${customerInfo.phone})
Product: ${product.name}
Amount: KSh ${total}
Payment: ${paymentMethod.toUpperCase()}
${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid via M-Pesa'}`;
      
      // You can integrate with WhatsApp Business API here
      console.log('Order confirmation message:', message);
      
    } catch (error) {
      console.error('Error sending confirmation:', error);
    }
  };
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
    if (!customerInfo.address.trim()) {
      toast.error('Please enter your delivery address');
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

            <div className="flex gap-2 pt-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={createOrder} 
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold h-12 text-lg shadow-lg"
                size="lg"
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
  if (orderStatus.status === 'pending_payment') {
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

  // Enhanced Payment confirmation with timer and auto-verification
  if (showPaymentConfirmation && orderStatus.paymentMethod === 'mpesa') {
    const minutes = Math.floor(paymentTimer / 60);
    const seconds = paymentTimer % 60;
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                STK Push Sent
              </div>
              <Badge variant="secondary">
                Order: {orderStatus.accountNumber}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                STK Push sent to <strong>{customerInfo.phone}</strong>. 
                Check your phone for the M-Pesa payment prompt.
              </AlertDescription>
            </Alert>

            {/* Payment Timer */}
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-2">Payment Timer</h4>
              <div className="text-2xl font-mono font-bold text-blue-600">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Please complete payment within this time
              </p>
            </div>

            {/* Payment Status */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">
                  Waiting for payment confirmation... This will update automatically once payment is received.
                </span>
              </div>
              
              {orderStatus.paymentResult?.instructions && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium mb-2">Manual Payment Instructions (if STK fails):</h4>
                  <pre className="text-sm whitespace-pre-wrap text-gray-700">
                    {orderStatus.paymentResult.instructions}
                  </pre>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => confirmPayment(true)}
                  className="flex-1"
                  disabled={isProcessing}
                  variant="outline"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've Paid Manually
                </Button>
                
                <Button
                  onClick={() => setShowPaymentConfirmation(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel Payment
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                💡 Payment will be verified automatically. Only click "I've Paid Manually" if you completed payment outside the STK push.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Retry Options Screen
  if (showRetryOptions) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-5 h-5" />
              Payment Issue Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {paymentTimer === 0 
                  ? "Payment timeout - no payment received within 5 minutes." 
                  : "STK Push failed or was cancelled."
                }
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">What would you like to do?</h4>
              
              <div className="space-y-2">
                {(orderStatus.retryCount || 0) < 3 && (
                  <Button
                    onClick={retryPayment}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Retry STK Push ({3 - (orderStatus.retryCount || 0)} attempts left)
                  </Button>
                )}
                
                <Button
                  onClick={() => processPayment('cash')}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Switch to Cash on Delivery
                </Button>
                
                <Button
                  onClick={() => {
                    setShowRetryOptions(false);
                    setOrderStatus(prev => ({ ...prev, status: 'pending_payment' }));
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Go Back to Payment Options
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm">
                  <strong>Need help?</strong> Contact support if you continue having issues:
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  📞 {businessSettings?.businessPhone || 'Contact merchant'}
                </p>
              </div>
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
