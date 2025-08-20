import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const envStatus = {
      MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY ? 'SET' : 'NOT SET',
      MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET ? 'SET' : 'NOT SET',
      MPESA_BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE ? 'SET' : 'NOT SET',
      MPESA_PASSKEY: process.env.MPESA_PASSKEY ? 'SET' : 'NOT SET',
      MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET'
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Environment variables check',
        environment: envStatus
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Debug function error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
