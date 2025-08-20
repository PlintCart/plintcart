// Simple test version of mpesa-status
// File: netlify/functions/mpesa-status-simple.js

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
    console.log('✅ Simple status function called');
    console.log('Path:', event.path);
    
    // Extract checkoutRequestId from path
    const pathParts = event.path.split('/');
    const checkoutRequestId = pathParts[pathParts.length - 1];
    
    console.log('Extracted ID:', checkoutRequestId);

    // For now, just return a pending status to test the endpoint
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkoutRequestId,
        status: 'pending',
        message: 'Status check working - M-Pesa query will be implemented next',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Simple status error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
