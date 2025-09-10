// Free M-Pesa Payment Integration using Netlify Functions
interface InitPaymentResult {
  success: boolean;
  message?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
  error?: string;
}

interface PaymentRequest {
  phone: string;
  amount: number;
  reference: string;
  description: string;
}

export class MpesaPayment {
  private baseUrl: string;

  constructor() {
    // Use current domain for API calls (works in development and production)
    this.baseUrl = window.location.origin;
  }

  async initiatePayment(paymentData: PaymentRequest): Promise<InitPaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/.netlify/functions/init-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  async checkPaymentStatus(checkoutRequestId: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/.netlify/functions/mpesa-status/${encodeURIComponent(checkoutRequestId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const text = await res.text();
        return { status: 'error', error: text || `HTTP ${res.status}` };
      }
      const data = await res.json();
      // Normalize to simple statuses used by UI
      const status = data.status || 'pending';
      return { status, ...data };
    } catch (error) {
      console.error('Status check error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }
}

export const mpesaPayment = new MpesaPayment();

// Legacy compatibility functions
export async function initSwyptPayment(orderId: string, channel: 'mpesa' | 'card' = 'mpesa') {
  // This is now a compatibility wrapper
  return {
    success: true,
    paymentStatus: 'pending',
    paymentRef: orderId,
    mpesa: { phone: '', instruction: 'Use the new payment flow' }
  };
}
