// REAL Status Checker - Uses stored callback data
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const pathParts = event.path.split('/');
    const checkoutRequestId = pathParts[pathParts.length - 1];
    
    console.log('🔍 Checking stored status for:', checkoutRequestId);

    // Check stored status from Firebase
    const response = await fetch(`/.netlify/functions/store-payment-status/${checkoutRequestId}`);
    const result = await response.json();

    console.log('📊 Stored status result:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkoutRequestId,
        status: result.status || 'pending',
        message: result.status === 'completed' ? 'Payment completed successfully' : 
                 result.status === 'cancelled' ? 'Payment was cancelled' :
                 result.status === 'failed' ? 'Payment failed' : 'Payment is being processed',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Status check error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkoutRequestId: pathParts[pathParts.length - 1],
        status: 'pending',
        message: 'Payment is being processed',
        timestamp: new Date().toISOString()
      })
    };
  }
};
