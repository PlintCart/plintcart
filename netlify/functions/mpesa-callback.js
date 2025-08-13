// Netlify Function for M-Pesa Callback Handling
// File: netlify/functions/mpesa-callback.js

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('M-Pesa Callback received:', event.body);
    
    const callbackData = JSON.parse(event.body);
    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      console.error('Invalid callback data structure');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          ResultCode: 1,
          ResultDesc: 'Invalid callback data'
        })
      };
    }

    const { stkCallback } = Body;
    const { 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = stkCallback;

    console.log(`Payment callback for ${CheckoutRequestID}: ${ResultDesc}`);

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;
      const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;

      console.log('Payment successful:', {
        checkoutRequestId: CheckoutRequestID,
        amount,
        mpesaReceiptNumber,
        phoneNumber,
        transactionDate
      });

      // Here you would typically:
      // 1. Update your database with payment success
      // 2. Update order status to "paid"
      // 3. Send confirmation email/SMS to customer
      // 4. Trigger order fulfillment process

      // For now, we'll just log the success
      // TODO: Implement database update logic

    } else {
      // Payment failed or cancelled
      console.log('Payment failed:', {
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc
      });

      // Here you would typically:
      // 1. Update database with payment failure
      // 2. Update order status to "failed"
      // 3. Notify customer of payment failure
      // 4. Optionally retry payment or provide alternative options

      // TODO: Implement failure handling logic
    }

    // Always respond with success to Safaricom
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      })
    };

  } catch (error) {
    console.error('Callback processing error:', error);
    
    // Still respond with success to avoid retries
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      })
    };
  }
};
