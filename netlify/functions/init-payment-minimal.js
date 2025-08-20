// Minimal init-payment function for urgent fix
// File: netlify/functions/init-payment-minimal.js

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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('💡 MINIMAL Payment function called');
    console.log('📋 Request body:', event.body);
    
    // For urgent fix - always return success to test the flow
    const mockCheckoutId = `MOCK_${Date.now()}`;
    
    console.log('🎭 Returning mock success response');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'STK push sent successfully (Mock Mode)',
        checkoutRequestId: mockCheckoutId,
        merchantRequestId: `MR_${Date.now()}`,
        responseCode: '0',
        responseDescription: 'Success. Request accepted for processing',
        customerMessage: 'Success. Request accepted for processing'
      })
    };

  } catch (error) {
    console.error('💥 Minimal payment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to initiate payment',
        error: error.message
      })
    };
  }
};
