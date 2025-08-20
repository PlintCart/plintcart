import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Log everything we receive
    const requestData = {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body,
      queryStringParameters: event.queryStringParameters,
      path: event.path
    };

    console.log('🔍 REQUEST DEBUG:', JSON.stringify(requestData, null, 2));

    // Try to parse the body
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      parsedBody = { error: 'Failed to parse JSON', rawBody: event.body };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Request logged successfully',
        receivedData: {
          method: event.httpMethod,
          bodyType: typeof event.body,
          bodyLength: event.body?.length || 0,
          parsedBody: parsedBody,
          contentType: event.headers['content-type'] || event.headers['Content-Type']
        }
      }, null, 2),
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
