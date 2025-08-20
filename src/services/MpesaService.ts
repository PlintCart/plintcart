/**
 * M-Pesa Payment Integration Service
 * Supports Paybill, Till Number, and Send Money payment methods
 * Backend handles Daraja API integration
 */

export interface MpesaSettings {
  enableMpesa: boolean;
  mpesaMethod: 'paybill' | 'till' | 'send_money';
  paybillNumber?: string;
  accountReference?: string;
  tillNumber?: string;
  mpesaPhoneNumber?: string;
  mpesaInstructions?: string;
}

export interface MpesaPaymentInstruction {
  method: 'paybill' | 'till' | 'send_money';
  instructions: string;
  details: {
    number?: string;
    accountReference?: string;
    amount: number;
  };
}

export interface PaymentRequest {
  phoneNumber: string;
  amount: number;
  orderId: string;
  description: string;
  merchantSettings: MpesaSettings;
}

export interface PaymentResponse {
  success: boolean;
  orderId: string;
  transactionId?: string;
  message: string;
  instructions?: string;
}

export class MpesaService {
  
  /**
   * Generate payment instructions based on merchant settings
   */
  static generatePaymentInstructions(
    settings: MpesaSettings, 
    amount: number, 
    orderId: string
  ): MpesaPaymentInstruction | null {
    if (!settings.enableMpesa) return null;

    const baseAmount = amount;
    let instructions = '';
    let details: any = { amount: baseAmount };

    switch (settings.mpesaMethod) {
      case 'paybill':
        if (!settings.paybillNumber) return null;
        
        const accountRef = settings.accountReference 
          ? settings.accountReference.replace('{orderNumber}', orderId)
          : orderId;
        
        instructions = `
1. Go to M-Pesa on your phone
2. Select "Lipa na M-Pesa"
3. Select "Pay Bill"
4. Enter Business Number: ${settings.paybillNumber}
5. Enter Account Number: ${accountRef}
6. Enter Amount: KSh ${baseAmount.toFixed(2)}
7. Enter your M-Pesa PIN and confirm
        `.trim();
        
        details.number = settings.paybillNumber;
        details.accountReference = accountRef;
        break;

      case 'till':
        if (!settings.tillNumber) return null;
        
        instructions = `
1. Go to M-Pesa on your phone
2. Select "Lipa na M-Pesa"
3. Select "Buy Goods and Services"
4. Enter Till Number: ${settings.tillNumber}
5. Enter Amount: KSh ${baseAmount.toFixed(2)}
6. Enter your M-Pesa PIN and confirm
        `.trim();
        
        details.number = settings.tillNumber;
        break;

      case 'send_money':
        if (!settings.mpesaPhoneNumber) return null;
        
        instructions = `
1. Go to M-Pesa on your phone
2. Select "Send Money"
3. Enter Phone Number: ${settings.mpesaPhoneNumber}
4. Enter Amount: KSh ${baseAmount.toFixed(2)}
5. Enter your M-Pesa PIN and confirm
6. Share the transaction message with us
        `.trim();
        
        details.number = settings.mpesaPhoneNumber;
        break;

      default:
        return null;
    }

    // Add custom instructions if provided
    if (settings.mpesaInstructions) {
      instructions += `\n\nAdditional Instructions:\n${settings.mpesaInstructions}`;
    }

    return {
      method: settings.mpesaMethod,
      instructions,
      details
    };
  }

  /**
   * Initiate payment (calls your Netlify function)
   */
  static async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Call the Netlify function (works in both dev and production)
      const response = await fetch('/.netlify/functions/init-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        // If function doesn't exist in dev, provide mock response for testing
        if (import.meta.env.DEV && response.status === 404) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          return {
            success: true,
            orderId: request.orderId,
            message: 'M-Pesa STK push sent to your phone (Development Mode)',
            transactionId: `DEV_${Date.now()}`,
            instructions: `Development Mode: Please check your phone ${request.phoneNumber} for the M-Pesa payment prompt to pay KSh ${request.amount}.`
          };
        }
        
        throw new Error(`Payment initiation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error initiating payment:', error);
      
      // Fallback to manual instructions
      const instructions = this.generatePaymentInstructions(
        request.merchantSettings, 
        request.amount, 
        request.orderId
      );
      
      return {
        success: true,
        orderId: request.orderId,
        message: 'Please follow the manual payment instructions below.',
        instructions: instructions?.instructions || 'Payment instructions not available'
      };
    }
  }

  /**
   * Check payment status (calls your Netlify function)
   */
  static async checkPaymentStatus(checkoutRequestId: string): Promise<any> {
    try {
      // Call your Netlify function
      const response = await fetch(`/.netlify/functions/mpesa-status-simple/${checkoutRequestId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      return { success: false, message: 'Unable to check payment status' };
    }
  }

  /**
   * Validate M-Pesa phone number format
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove spaces and special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check for valid Kenyan mobile number patterns
    const patterns = [
      /^254[17][0-9]{8}$/,  // 254 format
      /^0[17][0-9]{8}$/,    // 0 format
      /^\+254[17][0-9]{8}$/ // +254 format
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format phone number to M-Pesa format (254...)
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+254')) {
      return cleaned.substring(1);
    }
    
    return cleaned;
  }
}
