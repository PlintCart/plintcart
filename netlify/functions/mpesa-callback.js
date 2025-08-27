// Netlify Function for M-Pesa Callback Handling
// File: netlify/functions/mpesa-callback.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

exports.handler = async (event) => {
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
    console.log('M-Pesa Callback received:', event.body);
    
    const callbackData = JSON.parse(event.body);
    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      console.error('Invalid callback data structure');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          ResultCode: 1,
          ResultDesc: 'Invalid callback data'
        })
      };
    }

    const { stkCallback } = Body;
    const { 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = stkCallback;

    console.log(`Payment callback for ${CheckoutRequestID}: ${ResultDesc}`);

    // Find payment doc by checkoutRequestId
    const paymentsRef = db.collection("payments");
    const snapshot = await paymentsRef.where("checkoutRequestId", "==", CheckoutRequestID).get();

    if (snapshot.empty) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Payment not found for CheckoutRequestID" }),
      };
    }

    const paymentDoc = snapshot.docs[0];
    await paymentDoc.ref.update({
      status: ResultCode === 0 ? "success" : "failed",
      mpesaResponse: callbackData,
      updatedAt: new Date().toISOString(),
    });

    // Optionally, update subscription if payment is successful
    if (ResultCode === 0) {
      // Update related order document for payment confirmation
      const orderId = paymentDoc.data().orderId;
      if (orderId) {
        await db.collection("orders").doc(orderId).update({
          paymentStatus: "completed",
          status: "confirmed",
          paymentCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      // Optionally, update subscription if payment is successful
      const userId = paymentDoc.data().userId;
      if (userId) {
        await db.collection("subscriptions").doc(userId).set({
          isPremium: true,
          plan: "premium",
          upgradedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    // Always respond with success to Safaricom
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ResultCode: 0,
        ResultDesc: 'Accepted'
      })
    };

  } catch (error) {
    console.error('Callback processing error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
