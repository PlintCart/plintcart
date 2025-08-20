// REAL M-Pesa Status Checker - Fixed Version
const https = require('https');

// Get M-Pesa access token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      reject(new Error('M-Pesa credentials not configured'));
      return;
    }

    const credentials = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');
    
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
          if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('No access token received'));
          }
        } catch (error) {
          reject(new Error('Failed to parse token response'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Query payment status
function queryPaymentStatus(accessToken, checkoutRequestId) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const statusData = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

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
          reject(new Error('Failed to parse status response'));
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
    
    console.log('🔍 REAL status check for:', checkoutRequestId);

    // Get access token
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');

    // Query payment status
    const statusResult = await queryPaymentStatus(accessToken, checkoutRequestId);
    console.log('📊 M-Pesa raw result:', JSON.stringify(statusResult, null, 2));

    // Determine REAL payment status
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
      } else if (statusResult.ResultCode === '1') {
        paymentStatus = 'failed';
        message = 'Insufficient funds';
      } else {
        paymentStatus = 'failed';
        message = statusResult.ResultDesc || 'Payment failed';
      }
    } else if (statusResult.ResponseCode === '1037') {
      paymentStatus = 'pending';
      message = 'Payment request is still being processed';
    } else {
      paymentStatus = 'failed';
      message = statusResult.ResponseDescription || 'Payment status check failed';
    }

    console.log(`🎯 FINAL STATUS: ${paymentStatus} - ${message}`);

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
    console.error('❌ Real status check error:', error);
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
