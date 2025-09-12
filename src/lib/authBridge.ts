import { signInWithCustomToken, getAuth } from 'firebase/auth';

interface SignInResult {
  uid: string;
}

export async function signInWithWallet(walletAddress: string, provider: string = 'wallet', proof?: string): Promise<SignInResult> {
  const auth = getAuth();
  // Avoid duplicate sign-ins
  if (auth.currentUser?.uid === walletAddress) {
    return { uid: walletAddress };
  }

  // Use explicit URLs for development and production
  const url = import.meta.env.DEV 
    ? 'http://localhost:8888/.netlify/functions/mint-firebase-token'
    : 'https://plintcart.netlify.app/.netlify/functions/mint-firebase-token';

  try {
    console.log(`🔐 Attempting to mint Firebase token via: ${url}`);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, provider, proof }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Mint token failed (${resp.status}): ${text}`);
    }
    
    const { token } = await resp.json();
    const cred = await signInWithCustomToken(auth, token);
    console.log('✅ Firebase custom token sign-in successful via:', url);
    return { uid: cred.user.uid };
  } catch (error: any) {
    console.error(`❌ Failed to mint token via ${url}:`, error.message);
    throw new Error(`Token mint failed: ${error.message}`);
  }
}
