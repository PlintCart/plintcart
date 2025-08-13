// Netlify Function for checking payment status
// File: netlify/functions/mpesa-status.js

const https = require('https');

// Get M-Pesa access token
async function getAccessToken() {
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
        try {
          const response = JSON.parse(data);
          resolve(response.access_token);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
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
    // Extract checkoutRequestId from path or query parameters
    const pathParts = event.path.split('/');
    const checkoutRequestId = pathParts[pathParts.length - 1] || event.queryStringParameters?.checkoutRequestId;

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

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password for query
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    // Query data
    const queryData = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

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
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to check payment status'
      })
    };
  }
};
