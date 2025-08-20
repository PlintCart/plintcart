// Simple payment status storage using Firebase
// File: netlify/functions/store-payment-status.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to add your service account)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://takeapp-294ca-default-rtdb.firebaseio.com'
  });
}

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
    if (event.httpMethod === 'POST') {
      // Store payment status
      const { checkoutRequestId, status, resultCode, resultDesc } = JSON.parse(event.body);
      
      await admin.firestore().collection('payment_status').doc(checkoutRequestId).set({
        status,
        resultCode,
        resultDesc,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Status stored' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get payment status
      const pathParts = event.path.split('/');
      const checkoutRequestId = pathParts[pathParts.length - 1];
      
      const doc = await admin.firestore().collection('payment_status').doc(checkoutRequestId).get();
      
      if (doc.exists) {
        const data = doc.data();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            checkoutRequestId,
            status: data.status,
            resultCode: data.resultCode,
            resultDesc: data.resultDesc,
            timestamp: data.timestamp
          })
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            checkoutRequestId,
            status: 'pending',
            message: 'Payment still processing'
          })
        };
      }
    }

  } catch (error) {
    console.error('Storage error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
