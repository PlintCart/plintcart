# 🆓 FREE M-Pesa Payment Integration with Netlify Functions

## Overview

This implementation provides a **completely free** alternative to Firebase Cloud Functions using:
- **Netlify Functions** (Free tier: 125k function invocations/month)
- **Direct M-Pesa Daraja API** (Free with Safaricom developer account)
- **No monthly subscription fees**

## 🚀 Setup Instructions

### 1. Get M-Pesa Daraja API Credentials

1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create an account and login
3. Create a new app to get:
   - Consumer Key
   - Consumer Secret
   - Passkey (for STK Push)

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# M-Pesa Daraja API Configuration
MPESA_CONSUMER_KEY=your_sandbox_consumer_key_here
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret_here
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_sandbox_passkey_here
MPESA_CALLBACK_URL=https://your-site.netlify.app/.netlify/functions/mpesa-callback

# Environment
NODE_ENV=development
```

### 3. Deploy to Netlify

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add M-Pesa payment integration"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Deploy settings are automatic (using netlify.toml)

3. **Set Environment Variables in Netlify:**
   - Go to Site Settings → Environment Variables
   - Add all the M-Pesa variables from your .env file

### 4. Configure M-Pesa Callback URL

1. In your Safaricom Developer Portal
2. Update your app's callback URL to:
   ```
   https://your-site.netlify.app/.netlify/functions/mpesa-callback
   ```

## 💰 Cost Breakdown

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| Netlify Functions | 125k invocations | $0 |
| Netlify Hosting | Unlimited sites | $0 |
| M-Pesa Daraja API | Unlimited | $0 |
| **Total Cost** | | **$0/month** |

## 🔄 Payment Flow

1. **Customer clicks "Pay with M-Pesa"**
2. **Frontend calls** `/.netlify/functions/init-payment`
3. **Netlify Function** authenticates with Daraja API
4. **M-Pesa sends** STK Push to customer's phone
5. **Customer enters** M-Pesa PIN
6. **M-Pesa calls** `/.netlify/functions/mpesa-callback`
7. **Payment status** updated in real-time

## 📱 Testing

### Sandbox Testing Numbers
Use these test numbers in sandbox mode:
- Phone: `254708374149`
- PIN: `1234` (any 4 digits work in sandbox)

### Test Payment Flow
1. Use sandbox credentials
2. Enter test phone number
3. Complete payment with test PIN
4. Check function logs in Netlify

## 🔧 API Endpoints

### Initialize Payment
```bash
POST /.netlify/functions/init-payment
Content-Type: application/json

{
  "phone": "254712345678",
  "amount": 100,
  "reference": "ORDER-123",
  "description": "Payment for Product XYZ"
}
```

### Webhook (M-Pesa Callback)
```bash
POST /.netlify/functions/mpesa-callback
# Automatically called by M-Pesa with payment status
```

## 🛡️ Security Features

- ✅ CORS protection
- ✅ Request validation
- ✅ Phone number formatting
- ✅ Amount limits (1-300,000 KES)
- ✅ Error handling
- ✅ Environment variable isolation

## 🔍 Monitoring & Debugging

### Netlify Function Logs
1. Go to Netlify Dashboard
2. Functions tab
3. View real-time logs

### M-Pesa Transaction Status
Check payment status in:
- M-Pesa app transaction history
- Safaricom Developer Portal logs
- Your callback function logs

## 🚀 Production Deployment

### Switch to Live M-Pesa
1. Get production credentials from Safaricom
2. Update environment variables:
   ```bash
   MPESA_CONSUMER_KEY=your_live_consumer_key
   MPESA_CONSUMER_SECRET=your_live_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=your_live_shortcode
   MPESA_PASSKEY=your_live_passkey
   NODE_ENV=production
   ```

### Go Live Checklist
- [ ] Production M-Pesa credentials configured
- [ ] Callback URL updated in Safaricom portal
- [ ] Test with real phone numbers
- [ ] Monitor transaction logs
- [ ] Set up error alerting

## 🆘 Troubleshooting

### Common Issues

**1. "STK Push failed"**
- Check phone number format (254XXXXXXXXX)
- Verify M-Pesa credentials
- Check callback URL configuration

**2. "Function timeout"**
- Check Netlify function logs
- Verify internet connectivity
- Check M-Pesa API status

**3. "Invalid credentials"**
- Regenerate M-Pesa app credentials
- Check environment variable names
- Verify sandbox vs production settings

### Support Resources
- [Safaricom Developer Docs](https://developer.safaricom.co.ke/docs)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
- [M-Pesa Integration Guide](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)

## 💡 Benefits of This Approach

1. **100% Free** - No monthly fees
2. **Scalable** - Handles 125k payments/month on free tier
3. **Direct Integration** - No middleman payment processors
4. **Full Control** - Complete access to transaction data
5. **Mobile-First** - Optimized for Kenyan mobile payments
6. **Production Ready** - Built with security and error handling

---

**🎉 Your e-commerce platform now accepts M-Pesa payments completely free!**
