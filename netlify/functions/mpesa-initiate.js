// Netlify Function for M-Pesa Payment Processing
// File: netlify/functions/mpesa-initiate.js

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

// Main function for payment initiation
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { phoneNumber, amount, orderId, description } = JSON.parse(event.body);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    // Format phone number (ensure it starts with 254)
    const formattedPhone = phoneNumber.startsWith('254') 
      ? phoneNumber 
      : phoneNumber.replace(/^0/, '254');

    // STK Push request data
    const stkPushData = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: orderId,
      TransactionDesc: description || `Payment for ${orderId}`
    };

    // Make STK Push request
    const stkResponse = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(stkPushData);
      
      const options = {
        hostname: 'sandbox.safaricom.co.ke',
        path: '/mpesa/stkpush/v1/processrequest',
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

    if (stkResponse.ResponseCode === '0') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orderId,
          transactionId: stkResponse.CheckoutRequestID,
          message: 'Payment request sent to your phone. Please complete the payment.',
          instructions: 'Check your phone for the M-Pesa prompt and enter your PIN to complete payment.'
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: stkResponse.ResponseDescription || 'Payment initiation failed'
        })
      };
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error'
      })
    };
  }
};
