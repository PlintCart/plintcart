# 💳 Payment Features FAQ

## ❓ Common Questions

### **Q: How do customers pay for products?**
**A:** Customers have 3 options:
1. **Pay Now button** - Direct payment from product cards
2. **Payment links** - Shared via WhatsApp/social media
3. **Order button** - Traditional WhatsApp ordering

### **Q: What payment methods are supported?**
**A:** Currently M-Pesa with three configurations:
- **Paybill** - Business paybill number
- **Till Number** - Merchant till number  
- **Send Money** - Direct phone number transfer

### **Q: How does the STK Push work?**
**A:** 
1. Customer enters their M-Pesa phone number
2. System sends STK Push to their phone
3. Customer enters M-Pesa PIN to approve
4. Payment is processed instantly

### **Q: Are payment links secure?**
**A:** Yes! Payment links include:
- Encrypted product IDs
- Amount verification
- Secure M-Pesa processing
- Real-time fraud detection

### **Q: Can customers change quantity on payment links?**
**A:** Yes, the payment page allows quantity adjustment with automatic total calculation.

### **Q: What happens if payment fails?**
**A:** The system provides:
- Clear error messages
- Retry options
- Alternative payment instructions
- Customer support guidance

### **Q: How do I track payments?**
**A:** All payments are tracked in:
- Admin dashboard analytics
- Sales reports
- Stock management system
- Revenue tracking

### **Q: Can I customize payment messages?**
**A:** Yes, payment link messages include:
- Product name and price
- Custom business branding
- WhatsApp-optimized formatting
- Call-to-action buttons

### **Q: Is this mobile-friendly?**
**A:** Absolutely! Features include:
- Responsive payment dialogs
- Touch-optimized buttons
- Mobile-first design
- Fast loading on mobile data

### **Q: How do I set up M-Pesa?**
**A:** 
1. Go to Admin → Settings → Payment Methods
2. Choose your M-Pesa configuration type
3. Enter your business details
4. Test with sandbox credentials
5. Switch to production when ready

## 🛠️ Technical Questions

### **Q: Do I need special hosting for this?**
**A:** No! The system uses:
- Netlify Functions (serverless)
- Firebase (database)
- Frontend deployed anywhere
- No special server requirements

### **Q: How do I test payments?**
**A:** 
1. Use M-Pesa sandbox credentials
2. Test with small amounts (KES 1)
3. Verify callback handling
4. Check payment status updates

### **Q: Can I integrate with other payment providers?**
**A:** The system is designed for easy extension. You can add:
- Credit/debit cards
- Bank transfers
- Other mobile money providers
- International payment gateways

### **Q: What about payment confirmations?**
**A:** Customers receive:
- Instant SMS from M-Pesa
- On-screen confirmation
- Order status updates
- Receipt generation (coming soon)

### **Q: How do I handle refunds?**
**A:** Currently refunds are manual:
1. Check payment in M-Pesa dashboard
2. Process refund through M-Pesa
3. Update order status in admin
4. Notify customer

## 🚀 Marketing Questions

### **Q: How do I promote payment links?**
**A:** Best practices:
- Share on WhatsApp status
- Post on social media with thumbnails
- Include in SMS marketing
- Add to business cards/flyers

### **Q: Can I track which links generate sales?**
**A:** Yes! Analytics show:
- Payment source (storefront vs link)
- Most shared products
- Conversion rates by channel
- Revenue by marketing channel

### **Q: How do I create bulk payment links?**
**A:** For each product:
1. Go to storefront
2. Click Share → Share Payment Link
3. Links are automatically generated
4. Share across multiple channels

### **Q: What's the best way to use this for my business?**
**A:** Recommended strategy:
1. **Impulse Sales**: Use Pay Now buttons
2. **Social Media**: Share payment links
3. **In-Person**: Generate links on the spot
4. **Bulk Orders**: Use quantity adjustment features

## 🔧 Troubleshooting

### **Q: Payment button not working?**
**Check:**
- M-Pesa settings configured
- Internet connection stable
- Phone number format correct
- M-Pesa account has sufficient balance

### **Q: Payment links not generating?**
**Check:**
- Product has valid price
- Product is visible
- User has admin permissions
- Firebase connection active

### **Q: STK Push not received?**
**Common causes:**
- Wrong phone number format
- Phone not connected to network
- M-Pesa service temporarily down
- Number not registered for M-Pesa

### **Q: How do I get help?**
**Support options:**
- Check browser console for errors
- Test with sandbox credentials first
- Verify M-Pesa configuration
- Contact M-Pesa support for account issues

---

**💡 Pro Tip**: Start with sandbox testing, then gradually introduce features to customers once everything works smoothly!
