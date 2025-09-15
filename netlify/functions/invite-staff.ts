import { Handler } from '@netlify/functions';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

// Initialize Firebase (client SDK)
if (!getApps().length) {
  initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const auth = event.headers.authorization || '';
    // TODO: Verify the request comes from an authenticated owner

    const { email, role, vendorId } = JSON.parse(event.body || '{}');

    if (!email || !role || !vendorId) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // Ensure role is 'staff' for this system
    if (role !== 'staff') {
      return { statusCode: 400, body: 'Invalid role. Only staff invitations are supported.' };
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const db = getFirestore();

    // Store invitation in staffInvitations collection
    await setDoc(doc(db, 'staffInvitations', token), {
      email,
      role: 'staff',
      vendorId,
      token,
      expiresAt,
      createdAt: serverTimestamp(),
      status: 'pending'
    });

    // Send invitation email
    const invitationLink = `${process.env.URL || 'http://localhost:8080'}/invite/accept?token=${token}&role=${role}`;

    // Send email using a simple email service (you can use SendGrid, Nodemailer, etc.)
    try {
      // For now, we'll use a simple approach - in production, use proper email service
      const emailBody = `
        <h2>You've been invited to join our team!</h2>
        <p>You've been invited to join as a <strong>${role}</strong> member.</p>
        <p>Click the link below to accept your invitation and create your account:</p>
        <p><a href="${invitationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${invitationLink}</p>
        <p><small>This invitation will expire in 7 days.</small></p>
      `;

      // TODO: Replace with actual email service (SendGrid, AWS SES, etc.)
      // await sendEmail(email, 'Team Invitation', emailBody);
      
      console.log(`Invitation link for ${email}: ${invitationLink}`);
    } catch (emailError) {
      console.log('Email service not configured, invitation link:', invitationLink);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Invitation created successfully',
        invitationLink, // Remove this in production
        note: 'Email service not configured - invitation link logged to console'
      })
    };
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return { statusCode: 500, body: error.message };
  }
};
