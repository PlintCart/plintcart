import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');

    if (!token) {
      return { statusCode: 400, body: 'Missing token' };
    }

    const db = admin.firestore();

    // Find the invitation
    const invitesRef = db.collectionGroup('invites');
    const snapshot = await invitesRef.where('token', '==', token).limit(1).get();

    if (snapshot.empty) {
      return { statusCode: 404, body: 'Invalid invitation token' };
    }

    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data();

    // Check if expired
    if (inviteData.expiresAt.toDate() < new Date()) {
      return { statusCode: 400, body: 'Invitation has expired' };
    }

    // Check if already used
    if (inviteData.status === 'accepted') {
      return { statusCode: 400, body: 'Invitation has already been used' };
    }

    // Get the merchant ID from the path
    const pathParts = inviteDoc.ref.path.split('/');
    const merchantId = pathParts[1]; // merchants/{merchantId}/invites/{token}

    // Find user by email
    const userRecord = await admin.auth().getUserByEmail(inviteData.email);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      merchantId,
      role: inviteData.role
    });

    // Update invitation status
    await inviteDoc.ref.update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedBy: userRecord.uid
    });

    // Add to members collection
    await db.doc(`merchants/${merchantId}/members/${userRecord.uid}`).set({
      role: inviteData.role,
      email: inviteData.email,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Invitation validated and role assigned',
        role: inviteData.role,
        merchantId
      })
    };
  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return { statusCode: 500, body: error.message };
  }
};
