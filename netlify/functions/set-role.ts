import { Handler } from '@netlify/functions';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  try {
    const auth = event.headers.authorization || '';
    // TODO: verify bearer token belongs to owner and includes merchantId/role=owner

    const { uid, merchantId, role } = JSON.parse(event.body || '{}');

    // Basic validation
    if (!uid || !merchantId || !role) return { statusCode: 400, body: 'Missing fields' };

    // Store role in Firestore (Firebase auth with Firestore roles)
    const db = getFirestore();
    
    // Store the user's role in the roles collection
    await setDoc(doc(db, 'roles', uid), {
      role,
      merchantId,
      updatedAt: serverTimestamp()
    });

    // Also mirror to members collection for backward compatibility
    await setDoc(doc(db, `merchants/${merchantId}/members`, uid), {
      role, 
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { statusCode: 200, body: 'OK' };
  } catch (e: any) {
    return { statusCode: 500, body: e.message };
  }
};
