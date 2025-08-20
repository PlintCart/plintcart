// Netlify Function for M-Pesa STK Push
// File: netlify/functions/init-payment.js

const https = require('https');

// Get M-Pesa access token
async function getAccessToken() {
  console.log('🔑 Requesting access token...');
  
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
            console.log('✅ Access token obtained successfully');
            resolve(response.access_token);
          } else {
            console.error('❌ No access token in response:', response);
            reject(new Error('Failed to get access token'));
          }
        } catch (error) {
          console.error('❌ Failed to parse token response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Token request error:', error);
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
    console.log('🚀 Init payment function called');
    console.log('Request body:', event.body);
    console.log('Request headers:', event.headers);

    // Check environment variables first
    const requiredVars = [
      'MPESA_CONSUMER_KEY', 
      'MPESA_CONSUMER_SECRET', 
      'MPESA_BUSINESS_SHORT_CODE', 
      'MPESA_PASSKEY', 
      'MPESA_CALLBACK_URL'
    ];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
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

    console.log('✅ All environment variables present');

    // Parse request body
    if (!event.body) {
      console.error('❌ No request body provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Request body is required'
        })
      };
    }

    const requestData = JSON.parse(event.body);
    console.log('📥 Raw request data:', requestData);

    // Handle both direct and nested data structures
    const phoneNumber = requestData.phoneNumber;
    const amount = requestData.amount;
    const orderId = requestData.orderId;
    const description = requestData.description || `Payment for order ${orderId}`;

    console.log('📱 Extracted payment data:', { phoneNumber, amount, orderId, description });

    // Validate input
    if (!phoneNumber || !amount || !orderId) {
      console.error('❌ Missing required fields:', { phoneNumber, amount, orderId });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing required fields: phoneNumber, amount, orderId',
          received: { phoneNumber, amount, orderId, description }
        })
      };
    }

    console.log('✅ All required fields present');

    // Format phone number to 254XXXXXXXXX
    let formattedPhone = phoneNumber.toString().replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone;
    } else {
      formattedPhone = '254' + formattedPhone;
    }

    console.log('📞 Formatted phone:', formattedPhone);

    // Validate amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 1 || numAmount > 300000) {
      console.error('❌ Invalid amount:', { amount, numAmount });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid amount. Must be between 1 and 300,000 KES',
          received: { amount, numAmount }
        })
      };
    }

    console.log('💰 Validated amount:', numAmount);

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    console.log('🕐 Timestamp:', timestamp);
    console.log('🏢 Business short code:', process.env.MPESA_BUSINESS_SHORT_CODE);

    // STK Push data
    const stkPushData = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: numAmount,
      PartyA: formattedPhone,
      PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: orderId,
      TransactionDesc: description || `Payment for order ${orderId}`
    };

    console.log('📤 STK Push data:', stkPushData);

    // Make STK push request
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
          console.log('📥 M-Pesa STK response status:', res.statusCode);
          console.log('📥 M-Pesa STK response data:', data);
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            console.error('❌ Failed to parse STK response:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ STK request error:', error);
        reject(error);
      });
      req.write(postData);
      req.end();
    });

    console.log('📊 Final STK response:', stkResponse);

    // Check if STK push was successful
    if (stkResponse.ResponseCode === '0') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'STK push sent successfully',
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
          responseCode: stkResponse.ResponseCode,
          responseDescription: stkResponse.ResponseDescription,
          customerMessage: stkResponse.CustomerMessage
        })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'STK push failed',
          error: stkResponse.ResponseDescription || 'Unknown error',
          responseCode: stkResponse.ResponseCode
        })
      };
    }

  } catch (error) {
    console.error('💥 Payment initiation error:', error);
    console.error('💥 Error stack:', error.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to initiate payment',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
