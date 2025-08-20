// Debug function to test M-Pesa configuration
// File: netlify/functions/debug-mpesa.js

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
    console.log('🔍 Debug M-Pesa configuration...');

    // Check environment variables
    const envVars = {
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY ? 'SET' : 'MISSING',
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET ? 'SET' : 'MISSING',
      MPESA_BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE || 'MISSING',
      MPESA_PASSKEY: process.env.MPESA_PASSKEY ? 'SET' : 'MISSING',
      MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL || 'MISSING'
    };

    console.log('Environment variables:', envVars);

    // Test simple request format
    const testBody = event.body ? JSON.parse(event.body) : null;
    console.log('Test request body:', testBody);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Debug information',
        environment: envVars,
        requestBody: testBody,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Debug error:', error);
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
