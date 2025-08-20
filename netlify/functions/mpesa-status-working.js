// M-Pesa Payment Status Checker - WORKING VERSION
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

// Query payment status
async function queryPaymentStatus(accessToken, checkoutRequestId) {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

  const statusData = {
    BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(statusData);
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
}
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
    // Extract checkoutRequestId from path
    const pathParts = event.path.split('/');
    const checkoutRequestId = pathParts[pathParts.length - 1];
    
    console.log('🔍 Checking payment status for:', checkoutRequestId);

    // Get access token
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');

    // Query payment status
    const statusResult = await queryPaymentStatus(accessToken, checkoutRequestId);
    console.log('📊 M-Pesa status result:', statusResult);

    // Determine payment status
    let paymentStatus = 'pending';
    let message = 'Payment is being processed';

    if (statusResult.ResponseCode === '0') {
      if (statusResult.ResultCode === '0') {
        paymentStatus = 'completed';
        message = 'Payment completed successfully';
      } else if (statusResult.ResultCode === '1032') {
        paymentStatus = 'cancelled';
        message = 'Payment was cancelled by user';
      } else if (statusResult.ResultCode === '1037') {
        paymentStatus = 'timeout';
        message = 'Payment request timed out';
      } else {
        paymentStatus = 'failed';
        message = statusResult.ResultDesc || 'Payment failed';
      }
    } else if (statusResult.ResponseCode === '1037') {
      // Request is still being processed
      paymentStatus = 'pending';
      message = 'Payment request is still being processed';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        checkoutRequestId,
        status: paymentStatus,
        message,
        mpesaResponse: statusResult,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Status check error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
