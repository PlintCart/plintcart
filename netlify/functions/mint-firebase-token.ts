import { Handler, HandlerEvent, HandlerResponse } from '@netlify/functions';
import * as admin from 'firebase-admin';

// Lazy initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const creds = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: creds.project_id,
          clientEmail: creds.client_email,
          privateKey: creds.private_key?.replace(/\\n/g, '\n'),
        }),
        projectId: creds.project_id,
      });
      console.log('🔥 Admin initialized with provided service account JSON for project:', creds.project_id);
    } catch (err) {
      console.error('Failed parsing FIREBASE_SERVICE_ACCOUNT_JSON:', err);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format');
    }
  } else {
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable not found');
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable required');
  }
}

interface MintRequestBody {
  walletAddress?: string;
  proof?: string; // zk proof placeholder
  provider?: string; // 'google' | 'facebook' | 'wallet'
}

// Placeholder verification. Replace with actual zk proof verification.
async function verifyZkProof(_wallet: string, proof?: string): Promise<boolean> {
  // In production, implement real verification logic.
  return !!proof || true; // Currently permissive for development.
}

async function ensureUserDoc(walletAddress: string, provider: string) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(walletAddress);
  const snap = await userRef.get();

  // Determine if any owner exists
  const ownerSnap = await db.collection('users').where('role', '==', 'owner').limit(1).get();
  const firstOwner = ownerSnap.empty;

  if (snap.exists) {
    await userRef.update({
      lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
    });
    return snap.data();
  }

  const role = firstOwner ? 'owner' : (provider === 'google' ? 'manager' : 'cashier');
  const userDoc = {
    userId: walletAddress,
    walletAddress,
    provider: (provider || 'wallet'),
    signInTime: admin.firestore.FieldValue.serverTimestamp(),
    lastSignIn: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true,
    role,
    merchantId: firstOwner ? walletAddress : undefined,
  };
  await userRef.set(userDoc, { merge: true });
  return userDoc;
}

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const body: MintRequestBody = JSON.parse(event.body || '{}');
    const { walletAddress, proof, provider = 'wallet' } = body;

    if (!walletAddress) {
      return { 
        statusCode: 400, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'walletAddress required' }) 
      };
    }

    // Basic sanity check for a Sui / hex-like address (adjust as needed)
    if (!/^0x[a-fA-F0-9]{6,}$/.test(walletAddress)) {
      return { 
        statusCode: 400, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid walletAddress format' }) 
      };
    }

    const proofValid = await verifyZkProof(walletAddress, proof);
    if (!proofValid) {
      return { 
        statusCode: 401, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid zk proof' }) 
      };
    }

    await ensureUserDoc(walletAddress, provider);

    const customToken = await admin.auth().createCustomToken(walletAddress, {
      wallet: walletAddress,
      provider,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ token: customToken }),
    };
  } catch (err: any) {
    console.error('mint-firebase-token error:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal error', details: err.message }),
    };
  }
};
