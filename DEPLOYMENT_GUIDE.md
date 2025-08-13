# 🚀 Deployment Guide: M-Pesa Integration & Analytics

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Ensure your `.env` file has all necessary variables:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# M-Pesa Daraja API (Production)
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_BUSINESS_SHORT_CODE=your_business_shortcode
MPESA_PASSKEY=your_production_passkey
MPESA_CALLBACK_URL=https://your-domain.netlify.app/.netlify/functions/mpesa-callback
```

### 2. M-Pesa Go-Live Requirements
Before switching to production:
- [ ] Complete M-Pesa Go-Live process with Safaricom
- [ ] Get production credentials (Consumer Key, Consumer Secret, Passkey)
- [ ] Update callback URL to your live domain
- [ ] Test with small amounts first

## 🌐 Netlify Deployment

### Step 1: Build the Project
```bash
# Install dependencies
bun install

# Build for production
bun run build
```

### Step 2: Deploy to Netlify

#### Option A: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

#### Option B: Git Integration
1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Set build command: `bun run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

### Step 3: Configure Environment Variables in Netlify
1. Go to Site settings → Environment variables
2. Add all variables from your `.env` file
3. Update `MPESA_CALLBACK_URL` to your live domain

## 🔧 Production Configuration

### Update M-Pesa URLs
In `netlify/functions/mpesa-initiate.js`, change to production URLs:
```javascript
// Change from sandbox to production
const baseURL = 'https://api.safaricom.co.ke'; // Remove 'sandbox.'
```

### Update Callback URL
Update your callback URL in Daraja portal to:
```
https://your-domain.netlify.app/.netlify/functions/mpesa-callback
```

## 📊 Analytics Dashboard Access

Your analytics dashboard will be available at:
- **Admin Dashboard**: `https://your-domain.netlify.app/admin`
- **Stock Management**: `https://your-domain.netlify.app/admin/stock`
- **Analytics Tab**: Available in Stock Management page

### Analytics Features
- 📈 Most frequently bought products
- 💰 Revenue by product
- 📦 Stock turnover rates
- 🎯 Investment recommendations

## 💳 M-Pesa Payment Flow

### For Customers:
1. Add items to cart
2. Proceed to checkout
3. Select M-Pesa payment
4. Enter phone number
5. Approve STK push on phone
6. Payment confirmation

### For Merchants:
1. Configure payment settings in Admin → Settings
2. Choose payment method (Paybill/Till/Send Money)
3. Enter business details
4. Monitor payments in dashboard

## 🧪 Testing Checklist

### Before Go-Live:
- [ ] Test analytics with sample data
- [ ] Test M-Pesa with sandbox (small amounts)
- [ ] Verify all form validations
- [ ] Test mobile responsiveness
- [ ] Check Firebase security rules
- [ ] Verify SSL certificate

### Production Testing:
- [ ] Test M-Pesa with KES 1 transaction
- [ ] Verify callback handling
- [ ] Test payment status checks
- [ ] Monitor error logs

## 🚨 Troubleshooting

### Common Issues:

1. **M-Pesa "Invalid Access Token"**
   - Check consumer key/secret
   - Verify API URLs (sandbox vs production)

2. **Callback Not Receiving Data**
   - Verify callback URL in Daraja portal
   - Check Netlify function logs

3. **Analytics Not Loading**
   - Check Firebase security rules
   - Verify data structure in Firestore

4. **Build Failures**
   - Ensure all dependencies are installed
   - Check for TypeScript errors

## 📞 Support

- M-Pesa Support: developer.safaricom.co.ke
- Netlify Docs: docs.netlify.com
- Firebase Docs: firebase.google.com/docs

## 🎉 You're Ready!

Your e-commerce platform now has:
- ✅ Advanced sales analytics
- ✅ M-Pesa payment integration
- ✅ Stock management system
- ✅ Admin dashboard
- ✅ Responsive design

Happy selling! 🛍️
