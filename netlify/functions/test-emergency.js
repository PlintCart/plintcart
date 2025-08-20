// Test page for emergency STK function
exports.handler = async (event, context) => {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
<!DOCTYPE html>
<html>
<head>
    <title>Emergency STK Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .result { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .error { background: #ffebee; border-left: 4px solid #f44336; }
        .success { background: #e8f5e8; border-left: 4px solid #4caf50; }
        button { background: #2196f3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>🚨 Emergency STK Push Test</h1>
    
    <div>
        <label>Phone Number (254712345678):</label><br>
        <input type="text" id="phone" value="254712345678" placeholder="254712345678">
    </div>
    
    <div>
        <label>Amount (KSh):</label><br>
        <input type="number" id="amount" value="1" placeholder="1">
    </div>
    
    <button onclick="testSTK()">🚀 Send STK Push</button>
    
    <div id="result"></div>
    
    <script>
    async function testSTK() {
        const phone = document.getElementById('phone').value;
        const amount = document.getElementById('amount').value;
        const resultDiv = document.getElementById('result');
        
        resultDiv.innerHTML = '<div class="result">⏳ Sending STK push...</div>';
        
        try {
            const response = await fetch('/.netlify/functions/emergency-stk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: phone,
                    amount: parseInt(amount)
                })
            });
            
            const data = await response.text();
            let parsedData;
            try {
                parsedData = JSON.parse(data);
            } catch {
                parsedData = { rawResponse: data };
            }
            
            const cssClass = response.ok ? 'success' : 'error';
            resultDiv.innerHTML = \`
                <div class="result \${cssClass}">
                    <h3>Response (Status: \${response.status})</h3>
                    <pre>\${JSON.stringify(parsedData, null, 2)}</pre>
                </div>
            \`;
            
        } catch (error) {
            resultDiv.innerHTML = \`
                <div class="result error">
                    <h3>❌ Error</h3>
                    <p>\${error.message}</p>
                </div>
            \`;
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
