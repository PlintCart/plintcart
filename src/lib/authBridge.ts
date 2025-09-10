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

  // Try Netlify dev server first, fallback to production
  const urls = [
    'http://localhost:8888/.netlify/functions/mint-firebase-token',
    '/.netlify/functions/mint-firebase-token'
  ];

  let lastError: Error | null = null;
  
  for (const url of urls) {
    try {
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
      console.warn(`❌ Failed to mint token via ${url}:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All mint token endpoints failed. Last error: ${lastError?.message}`);
}
