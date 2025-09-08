import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';
import crypto from 'crypto';

if (!admin.apps.length) {
  const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const auth = event.headers.authorization || '';
    // TODO: Verify the request comes from an authenticated owner

    const { email, role, merchantId } = JSON.parse(event.body || '{}');

    if (!email || !role || !merchantId) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const db = admin.firestore();

    // Store invitation
    await db.collection(`merchants/${merchantId}/invites`).doc(token).set({
      email,
      role,
      token,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    // TODO: Send invitation email with link to /invite/accept?token=${token}&role=${role}

    const invitationLink = `${process.env.URL || 'http://localhost:5173'}/invite/accept?token=${token}&role=${role}`;

    // For now, just return the link (in production, send via email service)
    console.log(`Invitation link for ${email}: ${invitationLink}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Invitation created successfully',
        invitationLink // Remove this in production
      })
    };
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return { statusCode: 500, body: error.message };
  }
};
