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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Get configuration status
  const config = {
    consumer_key: !!process.env.MPESA_CONSUMER_KEY,
    consumer_key_length: process.env.MPESA_CONSUMER_KEY?.length || 0,
    consumer_secret: !!process.env.MPESA_CONSUMER_SECRET,
    consumer_secret_length: process.env.MPESA_CONSUMER_SECRET?.length || 0,
    business_short_code: process.env.MPESA_BUSINESS_SHORT_CODE || 'NOT_SET',
    passkey: !!process.env.MPESA_PASSKEY,
    passkey_length: process.env.MPESA_PASSKEY?.length || 0,
    callback_url: process.env.MPESA_CALLBACK_URL || 'NOT_SET',
    node_env: process.env.NODE_ENV || 'NOT_SET',
    netlify_site_url: process.env.URL || 'NOT_SET',
    deploy_url: process.env.DEPLOY_URL || 'NOT_SET'
  };

  const base_url = process.env.NODE_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      config,
      api_endpoint: `${base_url}/mpesa/stkpush/v1/processrequest`,
      oauth_endpoint: `${base_url}/oauth/v1/generate?grant_type=client_credentials`,
      timestamp: new Date().toISOString()
    }),
  };
};
