// EMERGENCY FIX - Simplified M-Pesa function to get STK working NOW
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse request
    const requestBody = JSON.parse(event.body || '{}');
    let { phoneNumber, amount } = requestBody;
    
    console.log('🔍 RECEIVED RAW DATA:');
    console.log('  Full request body:', JSON.stringify(requestBody, null, 2));
    console.log('  phoneNumber value:', phoneNumber);
    console.log('  phoneNumber type:', typeof phoneNumber);
    console.log('  amount:', amount);
    
    // Check if phoneNumber exists
    if (!phoneNumber) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Phone number is required',
          debug: {
            receivedData: requestBody,
            phoneNumber: phoneNumber,
            phoneNumberType: typeof phoneNumber
          }
        })
      };
    }
    
    // Convert to string if it's not already
    phoneNumber = String(phoneNumber);
    
    console.log('🔍 RECEIVED DATA:');
    console.log('  Original phoneNumber:', phoneNumber);
    console.log('  Amount:', amount);
    
    // FIX: Ensure phone number is in correct format for M-Pesa
    const originalPhone = phoneNumber;
    
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.substring(1);
    }
    if (!phoneNumber.startsWith('254')) {
      phoneNumber = '254' + phoneNumber;
    }
    
    console.log('🔧 PHONE TRANSFORMATION:');
    console.log('  Original:', originalPhone);
    console.log('  Transformed:', phoneNumber);
    console.log('  Length:', phoneNumber.length);
    console.log('  Regex test:', /^254\d{9}$/.test(phoneNumber));
    
    // Ensure phone number is exactly 12 digits starting with 254
    if (!/^254\d{9}$/.test(phoneNumber)) {
      console.log('❌ Phone validation failed');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Invalid phone number format. Got: ${phoneNumber}. Expected: 254XXXXXXXXX (12 digits)`,
          debug: {
            original: originalPhone,
            transformed: phoneNumber,
            length: phoneNumber.length,
            regexTest: /^254\d{9}$/.test(phoneNumber)
          }
        })
      };
    }
    
    console.log('✅ Phone validation passed');
    
    // Get access token
    const credentials = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
    
    // STK Push request
    const stkData = {
      BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
      PhoneNumber: phoneNumber,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `ORDER_${Date.now()}`,
      TransactionDesc: "Payment"
    };
    
    console.log('📱 STK REQUEST DATA:');
    console.log('  PhoneNumber:', phoneNumber);
    console.log('  Amount:', amount);
    console.log('  BusinessShortCode:', process.env.MPESA_BUSINESS_SHORT_CODE);
    console.log('  Full STK Data:', JSON.stringify(stkData, null, 2));
    
    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkData)
    });
    
    const stkResult = await stkResponse.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'STK push sent successfully',
        data: stkResult
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
