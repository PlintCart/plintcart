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
  phone: string;
  amount: number;
  reference: string;
  description: string;
}

// Get OAuth token from Daraja API
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${MPESA_CONFIG.consumer_key}:${MPESA_CONFIG.consumer_secret}`).toString('base64');
  
  const response = await fetch(`${MPESA_CONFIG.base_url}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  const data = await response.json() as { access_token: string };
  return data.access_token;
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
  const accessToken = await getAccessToken();
  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);
  
  const stkPushData = {
    BusinessShortCode: MPESA_CONFIG.business_short_code,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: paymentData.amount,
    PartyA: formatPhoneNumber(paymentData.phone),
    PartyB: MPESA_CONFIG.business_short_code,
    PhoneNumber: formatPhoneNumber(paymentData.phone),
    CallBackURL: MPESA_CONFIG.callback_url,
    AccountReference: paymentData.reference,
    TransactionDesc: paymentData.description
  };

  const response = await fetch(`${MPESA_CONFIG.base_url}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stkPushData),
  });

  return await response.json();
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
    const paymentData: PaymentRequest = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!paymentData.phone || !paymentData.amount || !paymentData.reference) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields: phone, amount, reference' 
        }),
      };
    }

    // Validate phone number format
    const formattedPhone = formatPhoneNumber(paymentData.phone);
    if (!formattedPhone.match(/^254[17]\d{8}$/)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Invalid phone number format. Use 254XXXXXXXXX or 07XXXXXXXX' 
        }),
      };
    }

    // Validate amount
    if (paymentData.amount < 1 || paymentData.amount > 300000) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Amount must be between 1 and 300,000 KES' 
        }),
      };
    }

    // Initiate STK Push
    const result = await initiateSTKPush(paymentData);
    
    // Check if STK push was successful
    if (result.ResponseCode === '0') {
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
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: result.ResponseDescription || 'STK Push failed',
          responseCode: result.ResponseCode
        }),
      };
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
