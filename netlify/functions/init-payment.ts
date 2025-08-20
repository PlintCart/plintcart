import { Handler } from '@netlify/functions';

// M-Pesa Daraja API Configuration
const MPESA_CONFIG = {
  consumer_key: process.env.MPESA_CONSUMER_KEY || '',
  consumer_secret: process.env.MPESA_CONSUMER_SECRET || '',
  business_short_code: process.env.MPESA_BUSINESS_SHORT_CODE || '',
  passkey: process.env.MPESA_PASSKEY || '',
  callback_url: process.env.MPESA_CALLBACK_URL || '',
  base_url: process.env.NODE_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke'
};

interface PaymentRequest {
  phoneNumber: string;
  amount: number;
  orderId: string;
  description: string;
  merchantSettings?: any;
}

// Get OAuth token from Daraja API
async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumer_key}:${MPESA_CONFIG.consumer_secret}`).toString('base64');
    
    console.log('🔑 Requesting access token...');
    const response = await fetch(`${MPESA_CONFIG.base_url}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OAuth failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string };
    console.log('✅ Access token received');
    return data.access_token;
  } catch (error) {
    console.error('❌ OAuth error:', error);
    throw error;
  }
}

// Generate timestamp for M-Pesa
function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}${second}`;
}

// Generate password for M-Pesa
function generatePassword(timestamp: string): string {
  const dataToEncode = MPESA_CONFIG.business_short_code + MPESA_CONFIG.passkey + timestamp;
  return Buffer.from(dataToEncode).toString('base64');
}

// Format phone number for M-Pesa (254xxxxxxxxx)
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
    cleanPhone = '254' + cleanPhone;
  } else if (!cleanPhone.startsWith('254')) {
    cleanPhone = '254' + cleanPhone;
  }
  
  return cleanPhone;
}

// Initiate STK Push
async function initiateSTKPush(paymentData: PaymentRequest): Promise<any> {
  try {
    console.log('📱 Starting STK Push process...');
    
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    const formattedPhone = formatPhoneNumber(paymentData.phoneNumber);
    
    console.log('📊 STK Push data:', {
      BusinessShortCode: MPESA_CONFIG.business_short_code,
      Amount: paymentData.amount,
      PartyA: formattedPhone,
      AccountReference: paymentData.orderId,
      timestamp
    });
    
    const stkPushData = {
      BusinessShortCode: MPESA_CONFIG.business_short_code,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: paymentData.amount,
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.business_short_code,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.callback_url,
      AccountReference: paymentData.orderId,
      TransactionDesc: paymentData.description
    };

    console.log('🚀 Sending STK Push request to Safaricom...');
    const response = await fetch(`${MPESA_CONFIG.base_url}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPushData),
    });

    const result = await response.json();
    console.log('📲 STK Push response:', result);
    
    if (!response.ok) {
      throw new Error(`STK Push failed: ${response.status} ${JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ STK Push error:', error);
    throw error;
  }
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('🎯 Init payment request received');
    console.log('📥 Raw body:', event.body);
    console.log('📋 Headers:', event.headers);

    // Check if environment variables are loaded
    if (!MPESA_CONFIG.consumer_key || !MPESA_CONFIG.consumer_secret) {
      console.error('❌ M-Pesa credentials not configured');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Payment service not configured properly',
          config: {
            consumer_key: !!MPESA_CONFIG.consumer_key,
            consumer_secret: !!MPESA_CONFIG.consumer_secret,
            business_short_code: !!MPESA_CONFIG.business_short_code,
            passkey: !!MPESA_CONFIG.passkey,
            callback_url: !!MPESA_CONFIG.callback_url
          }
        }),
      };
    }

    const paymentData: PaymentRequest = JSON.parse(event.body || '{}');
    console.log('📦 Parsed payment data:', paymentData);
    
    // Validate required fields
    if (!paymentData.phoneNumber || !paymentData.amount || !paymentData.orderId) {
      console.error('❌ Missing required fields');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields: phoneNumber, amount, orderId',
          received: {
            phoneNumber: !!paymentData.phoneNumber,
            amount: !!paymentData.amount,
            orderId: !!paymentData.orderId
          }
        }),
      };
    }

    // Validate phone number format
    const formattedPhone = formatPhoneNumber(paymentData.phoneNumber);
    if (!formattedPhone.match(/^254[17]\d{8}$/)) {
      console.error('❌ Invalid phone format:', formattedPhone);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX',
          provided: paymentData.phoneNumber,
          formatted: formattedPhone
        }),
      };
    }

    // Validate amount
    if (paymentData.amount < 1 || paymentData.amount > 300000) {
      console.error('❌ Invalid amount:', paymentData.amount);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Amount must be between 1 and 300,000 KES',
          provided: paymentData.amount
        }),
      };
    }

    // Initiate STK Push
    const result = await initiateSTKPush(paymentData);
    
    console.log('✅ STK Push completed with result:', result);
    
    // Check if STK push was successful
    if (result.ResponseCode === '0') {
      console.log('🎉 STK Push sent successfully!');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: result.CheckoutRequestID,
          merchantRequestId: result.MerchantRequestID,
          responseCode: result.ResponseCode,
          responseDescription: result.ResponseDescription,
          customerMessage: result.CustomerMessage
        }),
      };
    } else {
      console.error('❌ STK Push failed with response:', result);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: result.ResponseDescription || 'STK Push failed',
          responseCode: result.ResponseCode,
          fullResponse: result
        }),
      };
    }

  } catch (error) {
    console.error('💥 Payment initiation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
    };
  }
};
