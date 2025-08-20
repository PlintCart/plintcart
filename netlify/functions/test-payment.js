// Test function to receive payment data
// File: netlify/functions/test-payment.js

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
    console.log('🧪 Test payment function called');
    console.log('Method:', event.httpMethod);
    console.log('Headers:', event.headers);
    console.log('Body:', event.body);

    const requestData = event.body ? JSON.parse(event.body) : null;
    console.log('Parsed data:', requestData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Test endpoint received data',
        receivedData: requestData,
        extractedFields: {
          phoneNumber: requestData?.phoneNumber,
          amount: requestData?.amount,
          orderId: requestData?.orderId,
          description: requestData?.description,
          merchantSettings: requestData?.merchantSettings
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Test error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
