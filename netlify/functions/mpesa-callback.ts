import { Handler } from '@netlify/functions';

interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
    };
  };
}

// Simple in-memory storage for demo (in production, use a database)
const paymentStorage = new Map<string, any>();

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('M-Pesa Callback received:', event.body);
    
    const callbackData: MpesaCallback = JSON.parse(event.body || '{}');
    const stkCallback = callbackData.Body?.stkCallback;

    if (!stkCallback) {
      console.error('Invalid callback structure:', callbackData);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid callback structure' }),
      };
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    // Process the callback
    let paymentStatus = {
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      timestamp: new Date().toISOString(),
      success: ResultCode === 0
    };

    // If payment was successful, extract transaction details
    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const metadata = CallbackMetadata.Item.reduce((acc, item) => {
        acc[item.Name] = item.Value;
        return acc;
      }, {} as Record<string, any>);

      // Create new object with additional fields
      const successfulPayment = {
        ...paymentStatus,
        amount: metadata.Amount,
        mpesaReceiptNumber: metadata.MpesaReceiptNumber,
        transactionDate: metadata.TransactionDate,
        phoneNumber: metadata.PhoneNumber
      };
      
      paymentStatus = successfulPayment;

      console.log('Payment successful:', paymentStatus);
    } else {
      console.log('Payment failed:', paymentStatus);
    }

    // Store payment status (in production, save to database)
    paymentStorage.set(CheckoutRequestID, paymentStatus);

    // Log the result for debugging
    console.log(`Payment ${ResultCode === 0 ? 'successful' : 'failed'} for CheckoutRequestID: ${CheckoutRequestID}`);

    // Respond with success (M-Pesa expects 200 OK)
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Callback processed successfully',
        checkoutRequestId: CheckoutRequestID,
        status: ResultCode === 0 ? 'success' : 'failed'
      }),
    };

  } catch (error) {
    console.error('Callback processing error:', error);
    
    // Still return 200 to M-Pesa to avoid retries
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Callback received but failed to process',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
