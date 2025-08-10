import { useState } from 'react';
import { mpesaPayment } from '@/lib/payments/swypt';

interface PaymentData {
  phone: string;
  amount: number;
  reference: string;
  description: string;
}

export function usePayment(orderId?: string) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'pending' | 'paid' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | undefined>();
  const [instruction, setInstruction] = useState<string | undefined>();
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | undefined>();

  // New M-Pesa payment flow
  const initiatePayment = async (paymentData: PaymentData) => {
    setError(null);
    setStatus('starting');

    try {
      const result = await mpesaPayment.initiatePayment(paymentData);
      
      if (result.success) {
        setStatus('pending');
        setPaymentRef(result.checkoutRequestId);
        setCheckoutRequestId(result.checkoutRequestId);
        setInstruction(result.customerMessage || 'Check your phone for the M-Pesa prompt');
        return { success: true, checkoutRequestId: result.checkoutRequestId };
      } else {
        setError(result.error || 'Payment initiation failed');
        setStatus('failed');
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      setStatus('failed');
      return { success: false, error: errorMessage };
    }
  };

  // Legacy compatibility for existing code
  const startPayment = async (channel: 'mpesa' | 'card' = 'mpesa') => {
    if (!orderId) return;
    setError(null);
    setStatus('starting');
    try {
      // For now, just set to pending state
      setStatus('pending');
      setInstruction('Use the new payment button for M-Pesa payments');
    } catch (e: any) {
      setError(e.message);
      setStatus('failed');
    }
  };

  const checkPaymentStatus = async () => {
    if (!checkoutRequestId) return;
    
    try {
      const result = await mpesaPayment.checkPaymentStatus(checkoutRequestId);
      if (result.status === 'success') {
        setStatus('paid');
      } else if (result.status === 'failed') {
        setStatus('failed');
        setError(result.error || 'Payment failed');
      }
      return result;
    } catch (err) {
      console.error('Status check failed:', err);
      return { status: 'error' };
    }
  };

  return { 
    status, 
    error, 
    paymentRef, 
    instruction, 
    checkoutRequestId,
    startPayment,
    initiatePayment,
    checkPaymentStatus,
    clearError: () => setError(null)
  };
}
