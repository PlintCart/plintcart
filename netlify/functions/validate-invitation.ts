import { Handler } from '@netlify/functions';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, limit, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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
    const { token, userId } = JSON.parse(event.body || '{}');

    if (!token || !userId) {
      return { statusCode: 400, body: 'Missing token or userId' };
    }

    const db = getFirestore();

    // Find the invitation
    const invitesRef = collectionGroup(db, 'invites');
    const q = query(invitesRef, where('token', '==', token), limit(1));
    const snapshot = await getDocs(q);

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

    // Store role in Firestore (since we're using zkLogin, no auth lookup needed)
    await setDoc(doc(db, 'roles', userId), {
      role: inviteData.role,
      merchantId,
      updatedAt: serverTimestamp()
    });

    // Update invitation status
    await updateDoc(inviteDoc.ref, {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedBy: userId
    });

    // Add to members collection
    await setDoc(doc(db, `merchants/${merchantId}/members`, userId), {
      role: inviteData.role,
      email: inviteData.email,
      joinedAt: serverTimestamp()
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
