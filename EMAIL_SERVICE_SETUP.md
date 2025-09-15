# Email Service Setup Guide

Currently, the staff invitation system creates invitation links but doesn't send emails automatically. Here's how to set up email service:

## Current Behavior
- ✅ Invitation tokens are created and stored
- ✅ Invitation links are generated
- ❌ No emails are sent automatically
- 🔧 Links are copied to clipboard for manual sharing

## Quick Setup Options

### Option 1: EmailJS (Free, Easy Setup)
1. Sign up at [EmailJS.com](https://emailjs.com)
2. Create an email template
3. Add these environment variables:
   ```
   EMAILJS_SERVICE_ID=your_service_id
   EMAILJS_TEMPLATE_ID=your_template_id
   EMAILJS_PUBLIC_KEY=your_public_key
   ```

### Option 2: SendGrid (Professional)
1. Sign up at [SendGrid.com](https://sendgrid.com)
2. Get API key
3. Add environment variable:
   ```
   SENDGRID_API_KEY=your_api_key
   ```

### Option 3: Nodemailer with Gmail
1. Set up Gmail App Password
2. Add environment variables:
   ```
   GMAIL_USER=your_email@gmail.com
   GMAIL_PASS=your_app_password
   ```

## Implementation
The email sending code is in `netlify/functions/invite-staff.ts` at line 60-70. Replace the TODO section with your chosen email service.

## Current Workaround
1. Click "Send Invitation" in Staff Management
2. The invitation link will be copied to your clipboard
3. Manually send this link to your staff member via email, WhatsApp, or SMS
4. Staff member clicks the link to create their account and join your team

## Staff Onboarding Process
1. **Admin**: Create invitation → Get link → Share with staff
2. **Staff**: Click link → Create account → Get staff role automatically
3. **System**: Validates invitation → Assigns role → Adds to team

The invitation system works perfectly - it just needs manual link sharing until email service is configured.
