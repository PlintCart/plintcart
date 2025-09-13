import { Handler } from '@netlify/functions';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, limit, getDocs, doc, updateDoc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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

    // Find the invitation in staffInvitations collection
    const inviteRef = doc(db, 'staffInvitations', token);
    const inviteDoc = await getDoc(inviteRef);

    if (!inviteDoc.exists()) {
      return { statusCode: 404, body: 'Invalid invitation token' };
    }

    const inviteData = inviteDoc.data();

    // Check if expired
    if (inviteData.expiresAt.toDate() < new Date()) {
      return { statusCode: 400, body: 'Invitation has expired' };
    }

    // Check if already used
    if (inviteData.status === 'accepted') {
      return { statusCode: 400, body: 'Invitation has already been used' };
    }

    const vendorId = inviteData.vendorId;

    // Update user document with staff role and vendor relationship  
    await setDoc(doc(db, 'users', userId), {
      role: 'staff',
      vendorId: vendorId,
      email: inviteData.email,
      joinedAt: serverTimestamp(),
      isActive: true
    }, { merge: true });

    // Add staff to vendor's staff array
    const vendorRef = doc(db, 'users', vendorId);
    const vendorDoc = await getDoc(vendorRef);
    if (vendorDoc.exists()) {
      const vendorData = vendorDoc.data();
      const currentStaff = vendorData.staff || [];
      if (!currentStaff.includes(userId)) {
        await updateDoc(vendorRef, {
          staff: [...currentStaff, userId]
        });
      }
    }

    // Update invitation status
    await updateDoc(doc(db, 'staffInvitations', token), {
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      acceptedBy: userId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Invitation validated and role assigned',
        role: 'staff',
        vendorId
      })
    };
  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return { statusCode: 500, body: error.message };
  }
};
