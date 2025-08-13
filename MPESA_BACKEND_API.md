# M-Pesa Payment Integration Backend API

This document outlines the backend API endpoints you need to implement for M-Pesa payment processing using the Daraja API.

## Overview

The frontend will call your backend API endpoints to handle M-Pesa payments. Your backend should:
1. Integrate with Safaricom's Daraja API
2. Handle STK Push requests
3. Process payment callbacks
4. Store payment records in your database

## Required API Endpoints

### 1. Initiate Payment

**Endpoint**: `POST /api/payments/mpesa/initiate`

**Request Body**:
```json
{
  "phoneNumber": "254712345678",
  "amount": 1500,
  "orderId": "ORDER-1691234567890",
  "description": "Payment for order ORDER-1691234567890",
  "merchantSettings": {
    "enableMpesa": true,
    "mpesaMethod": "paybill",
    "paybillNumber": "522522",
    "accountReference": "ORDER{orderNumber}",
    "tillNumber": null,
    "mpesaPhoneNumber": null,
    "mpesaInstructions": "Please pay within 10 minutes"
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "orderId": "ORDER-1691234567890",
  "transactionId": "ws_CO_DMZ_123456789_12082025194532456",
  "message": "Payment request sent to your phone. Please complete the payment.",
  "instructions": "Check your phone for the M-Pesa prompt and enter your PIN to complete payment."
}
```

**Response** (Fallback to manual):
```json
{
  "success": true,
  "orderId": "ORDER-1691234567890",
  "message": "Please follow the manual payment instructions below.",
  "instructions": "1. Go to M-Pesa on your phone\n2. Select \"Lipa na M-Pesa\"\n3. Select \"Pay Bill\"\n4. Enter Business Number: 522522\n5. Enter Account Number: ORDER-1691234567890\n6. Enter Amount: KSh 1500.00\n7. Enter your M-Pesa PIN and confirm"
}
```

### 2. Check Payment Status

**Endpoint**: `GET /api/payments/mpesa/status/{orderId}`

**Response**:
```json
{
  "success": true,
  "orderId": "ORDER-1691234567890",
  "status": "completed", // "pending", "completed", "failed", "cancelled"
  "transactionId": "ws_CO_DMZ_123456789_12082025194532456",
  "mpesaReceiptNumber": "NLJ7RT61SV",
  "amount": 1500,
  "customerPhone": "254712345678",
  "completedAt": "2025-08-12T10:30:45.123Z"
}
```

### 3. Payment Callback (Webhook)

**Endpoint**: `POST /api/payments/mpesa/callback`

This endpoint receives callbacks from Safaricom when payments are completed.

**Request Body** (from Safaricom):
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_DMZ_123456789_12082025194532456",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1500
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "NLJ7RT61SV"
          },
          {
            "Name": "TransactionDate",
            "Value": 20251212103045
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

**Response**:
```json
{
  "ResultCode": 0,
  "ResultDesc": "Accepted"
}
```

## Implementation Guide

### 1. Environment Setup

```bash
# Sandbox URLs
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey

# Production URLs
MPESA_BASE_URL=https://api.safaricom.co.ke
```

### 2. Database Schema

Create tables to store:

**payments**:
```sql
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  merchant_id VARCHAR(255) NOT NULL,
  checkout_request_id VARCHAR(255),
  mpesa_receipt_number VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  customer_phone VARCHAR(20),
  status ENUM('pending', 'completed', 'failed', 'cancelled'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);
```

### 3. Sample Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const axios = require('axios');

// Get M-Pesa access token
async function getAccessToken() {
  const credentials = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');
  
  const response = await axios.get(
    `${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    }
  );
  
  return response.data.access_token;
}

// Initiate STK Push
app.post('/api/payments/mpesa/initiate', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, merchantSettings } = req.body;
    
    const accessToken = await getAccessToken();
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');
    
    const stkPushData = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.BASE_URL}/api/payments/mpesa/callback`,
      AccountReference: orderId,
      TransactionDesc: `Payment for ${orderId}`
    };
    
    const response = await axios.post(
      `${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.ResponseCode === '0') {
      // Save payment record
      await savePayment({
        orderId,
        checkoutRequestId: response.data.CheckoutRequestID,
        amount,
        customerPhone: phoneNumber,
        status: 'pending'
      });
      
      res.json({
        success: true,
        orderId,
        transactionId: response.data.CheckoutRequestID,
        message: 'Payment request sent to your phone. Please complete the payment.'
      });
    } else {
      res.json({
        success: false,
        message: response.data.ResponseDescription
      });
    }
  } catch (error) {
    console.error('STK Push error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed'
    });
  }
});

// Payment callback
app.post('/api/payments/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;
    
    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackData = stkCallback.CallbackMetadata.Item;
      const amount = callbackData.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = callbackData.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const phoneNumber = callbackData.find(item => item.Name === 'PhoneNumber')?.Value;
      
      await updatePayment(stkCallback.CheckoutRequestID, {
        status: 'completed',
        mpesaReceiptNumber,
        completedAt: new Date()
      });
    } else {
      // Payment failed
      await updatePayment(stkCallback.CheckoutRequestID, {
        status: 'failed'
      });
    }
    
    res.json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  } catch (error) {
    console.error('Callback error:', error);
    res.json({
      ResultCode: 1,
      ResultDesc: 'Error'
    });
  }
});
```

## Security Considerations

1. **Validate Callbacks**: Verify that callbacks are from Safaricom
2. **Environment Variables**: Store sensitive keys in environment variables
3. **Rate Limiting**: Implement rate limiting on payment endpoints
4. **Logging**: Log all payment attempts and callbacks
5. **Idempotency**: Handle duplicate payment requests gracefully

## Testing

Use Safaricom's sandbox environment for testing:
- **Shortcode**: 174379
- **Test Phone Numbers**: 254708374149, 254711232879
- **Test Amount**: Any amount between 1-70000

## Production Checklist

Before going live:
- [ ] Switch to production URLs
- [ ] Update business shortcode and passkey
- [ ] Set up proper SSL certificates
- [ ] Implement proper error handling
- [ ] Set up monitoring and alerts
- [ ] Test with real phone numbers
- [ ] Configure proper callback URLs
