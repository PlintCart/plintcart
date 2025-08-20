// Test init-payment with exact data format
// File: netlify/functions/test-init-payment.js

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('🧪 Test init-payment function called');
    
    if (event.httpMethod === 'GET') {
      // Show a test form
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'text/html' },
        body: `
<!DOCTYPE html>
<html>
<head>
    <title>Test M-Pesa Payment</title>
</head>
<body>
    <h1>Test M-Pesa Payment</h1>
    <button onclick="testPayment()">Test Payment Request</button>
    <pre id="result"></pre>
    
    <script>
    async function testPayment() {
        const testData = {
            phoneNumber: "254712345678",
            amount: 100,
            orderId: "TEST_ORDER_123",
            description: "Test payment",
            merchantSettings: {
                enableMpesa: true,
                mpesaMethod: "paybill"
            }
        };
        
        try {
            const response = await fetch('/.netlify/functions/init-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData)
            });
            
            const result = await response.text();
            document.getElementById('result').textContent = 
                'Status: ' + response.status + '\\n' +
                'Response: ' + result;
        } catch (error) {
            document.getElementById('result').textContent = 'Error: ' + error.message;
        }
    }
    </script>
</body>
</html>
        `
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };

  } catch (error) {
    console.error('Test error:', error);
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
