// Netlify Function for checking payment status
// File: netlify/functions/mpesa-status.js

const https = require('https');

// Get M-Pesa access token
async function getAccessToken() {
  console.log('Getting M-Pesa access token...');
  
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
    throw new Error('M-Pesa consumer key or secret not configured');
  }

  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sandbox.safaricom.co.ke',
      path: '/oauth/v1/generate?grant_type=client_credentials',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Token response status:', res.statusCode);
        console.log('Token response data:', data);
        try {
          const response = JSON.parse(data);
          if (response.access_token) {
            console.log('Access token obtained successfully');
            resolve(response.access_token);
          } else {
            console.error('No access token in response:', response);
            reject(new Error('Failed to get access token'));
          }
        } catch (error) {
          console.error('Failed to parse token response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Token request error:', error);
      reject(error);
    });
    req.end();
  });
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Status check function called');
    console.log('Event path:', event.path);
    console.log('Query params:', event.queryStringParameters);

    // Check environment variables
    const requiredVars = ['MPESA_CONSUMER_KEY', 'MPESA_CONSUMER_SECRET', 'MPESA_BUSINESS_SHORT_CODE', 'MPESA_PASSKEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Server configuration error',
          error: `Missing environment variables: ${missingVars.join(', ')}`
        })
      };
    }

    // Extract checkoutRequestId from path or query parameters
    const pathParts = event.path.split('/');
    const checkoutRequestId = pathParts[pathParts.length - 1] || event.queryStringParameters?.checkoutRequestId;

    console.log('Extracted checkoutRequestId:', checkoutRequestId);

    if (!checkoutRequestId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'CheckoutRequestID is required'
        })
      };
    }

    console.log('Getting access token...');
    // Get access token
    const accessToken = await getAccessToken();
    console.log('Access token obtained successfully');

    // Generate timestamp and password for query
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    console.log('Query timestamp:', timestamp);
    console.log('Business short code:', process.env.MPESA_BUSINESS_SHORT_CODE);

    // Query data
    const queryData = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    console.log('Making status query request...');
    // Make status query request
    const queryResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(queryData);
      
      const options = {
        hostname: 'sandbox.safaricom.co.ke',
        path: '/mpesa/stkpushquery/v1/query',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log('M-Pesa API response:', data);
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            console.error('Failed to parse M-Pesa response:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });
      req.write(postData);
      req.end();
    });

    console.log('M-Pesa query response:', queryResponse);

    // Process the response
    let status = 'pending';
    let mpesaReceiptNumber = null;

    if (queryResponse.ResultCode === '0') {
      status = 'completed';
      // Extract receipt number if available in ResponseDescription
      const match = queryResponse.ResponseDescription?.match(/([A-Z0-9]{10})/);
      mpesaReceiptNumber = match ? match[1] : null;
    } else if (queryResponse.ResultCode === '1032') {
      status = 'cancelled';
    } else if (queryResponse.ResultCode) {
      status = 'failed';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkoutRequestId,
        status,
        resultCode: queryResponse.ResultCode,
        resultDescription: queryResponse.ResponseDescription,
        mpesaReceiptNumber,
        checkedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Status check error:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to check payment status',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
