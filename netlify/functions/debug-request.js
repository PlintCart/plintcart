// Debug function to log exact request data
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🔍 DEBUG - Raw event body:', event.body);
    console.log('🔍 DEBUG - Event httpMethod:', event.httpMethod);
    console.log('🔍 DEBUG - Event headers:', event.headers);

    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
      console.log('🔍 DEBUG - Parsed request data:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.log('🔍 DEBUG - JSON parse error:', parseError.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          rawBody: event.body
        })
      };
    }

    // Log each field and its type
    const fields = ['phoneNumber', 'amount', 'orderId', 'description', 'merchantSettings'];
    for (const field of fields) {
      const value = requestData[field];
      console.log(`🔍 DEBUG - ${field}: ${JSON.stringify(value)} (type: ${typeof value})`);
    }

    // Check if merchantSettings is an object
    if (requestData.merchantSettings) {
      console.log('🔍 DEBUG - merchantSettings details:', JSON.stringify(requestData.merchantSettings, null, 2));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Debug complete - check logs',
        receivedData: requestData,
        dataTypes: {
          phoneNumber: typeof requestData.phoneNumber,
          amount: typeof requestData.amount,
          orderId: typeof requestData.orderId,
          description: typeof requestData.description,
          merchantSettings: typeof requestData.merchantSettings
        }
      })
    };

  } catch (error) {
    console.error('🔍 DEBUG - Error:', error);
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
