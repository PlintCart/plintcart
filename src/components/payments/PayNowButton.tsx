import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';

interface PayNowButtonProps {
  productId: string;
  productName: string;
  price: number;
  onPaymentSuccess?: (checkoutRequestId: string) => void;
  onPaymentError?: (error: string) => void;
  // Legacy compatibility
  orderId?: string;
  channel?: 'mpesa' | 'card';
}

export function PayNowButton({ 
  productId, 
  productName, 
  price, 
  onPaymentSuccess, 
  onPaymentError,
  orderId,
  channel = 'mpesa'
}: PayNowButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { status, error, instruction, initiatePayment, clearError, startPayment } = usePayment(orderId);

  // Legacy mode for existing code
  if (orderId && !productId) {
    const disabled = status === 'starting' || status === 'pending' || status === 'paid';
    const label = status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending...' : 'Pay Now';

    return (
      <Button 
        disabled={disabled} 
        onClick={() => startPayment(channel)} 
        variant="default" 
        size="sm"
        data-pay-button
      >
        {status === 'starting' || status === 'pending' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {label}
      </Button>
    );
  }

  // New M-Pesa flow
  const handlePayment = async () => {
    if (!phone) {
      onPaymentError?.('Phone number is required');
      return;
    }

    // Validate phone number format
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.match(/^(254|0)?[17]\d{8}$/)) {
      onPaymentError?.('Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const paymentData = {
        phone: cleanPhone,
        amount: price,
        reference: `ORDER-${productId}-${Date.now()}`,
        description: `Payment for ${productName}`
      };

      const result = await initiatePayment(paymentData);
      
      if (result.success) {
        onPaymentSuccess?.(result.checkoutRequestId || '');
        // Keep dialog open to show instructions
      } else {
        onPaymentError?.(result.error || 'Payment initiation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      onPaymentError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.startsWith('254')) {
      return digits.slice(0, 12);
    } else if (digits.startsWith('0')) {
      return digits.slice(0, 10);
    } else {
      return '0' + digits.slice(0, 9);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-green-600 hover:bg-green-700">
          <Smartphone className="w-4 h-4 mr-2" />
          Pay KES {price.toLocaleString()} with M-Pesa
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            M-Pesa Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Product:</strong> {productName}</p>
            <p><strong>Amount:</strong> KES {price.toLocaleString()}</p>
          </div>

          {status === 'idle' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Safaricom number
                </p>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={!phone || isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initiating Payment...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Send M-Pesa Prompt
                  </>
                )}
              </Button>
            </div>
          )}

          {(status !== 'idle' || error) && (
            <Alert>
              <AlertDescription>
                {status === 'pending' && instruction}
                {status === 'paid' && 'Payment successful!'}
                {(status === 'failed' || error) && (error || 'Payment failed')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
