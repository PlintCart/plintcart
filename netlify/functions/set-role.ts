import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

export const handler: Handler = async (event) => {
  try {
    const auth = event.headers.authorization || '';
    // TODO: verify bearer token belongs to owner and includes merchantId/role=owner

    const { uid, merchantId, role } = JSON.parse(event.body || '{}');

    // Basic validation
    if (!uid || !merchantId || !role) return { statusCode: 400, body: 'Missing fields' };

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { merchantId, role });

    // Mirror to Firestore members
    const db = admin.firestore();
    await db.doc(`merchants/${merchantId}/members/${uid}`).set(
      { role, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    return { statusCode: 200, body: 'OK' };
  } catch (e: any) {
    return { statusCode: 500, body: e.message };
  }
};
