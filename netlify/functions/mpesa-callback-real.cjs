// M-Pesa Callback - Receives real payment notifications
// File: netlify/functions/mpesa-callback.js

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🔔 M-Pesa callback received');
    console.log('📥 Callback body:', event.body);
    
    const callbackData = JSON.parse(event.body || '{}');
    
    // Extract payment result
    const stkCallback = callbackData.Body?.stkCallback;
    if (!stkCallback) {
      console.log('❌ No stkCallback in data');
      return { statusCode: 200, headers, body: JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }) };
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;

    console.log(`📋 Payment Result: ${checkoutRequestId} - Code: ${resultCode} - ${resultDesc}`);

    // Store payment result in a simple way (you can use a database later)
    // For now, we'll store in memory or use Firebase
    
    // Determine status
    let status = 'failed';
    if (resultCode === 0) {
      status = 'completed';
      console.log('✅ Payment completed successfully');
    } else if (resultCode === 1032) {
      status = 'cancelled';
      console.log('❌ Payment cancelled by user');
    } else {
      status = 'failed';
      console.log('❌ Payment failed:', resultDesc);
    }

    // TODO: Store this status so the status checker can read it
    // For now, just log it
    console.log(`🎯 Final status for ${checkoutRequestId}: ${status}`);

    // Respond to M-Pesa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Accepted"
      })
    };

  } catch (error) {
    console.error('❌ Callback error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ResultCode: 0,
        ResultDesc: "Accepted"
      })
    };
  }
};
