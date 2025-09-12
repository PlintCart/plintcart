import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase app immediately
const app = initializeApp(firebaseConfig);
console.log('🔥 Firebase app initialized successfully');

// Initialize Firestore immediately
const dbInstance = getFirestore(app);

// Initialize Storage immediately
const storageInstance = getStorage(app);

// Initialize Analytics immediately
const analyticsInstance = getAnalytics(app);

// Initialize Auth immediately (for custom token sign-in)
const authInstance = getAuth(app);

// Connect to emulator only in development with explicit flag
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    console.log('🔧 Attempting to connect to Firestore emulator...');
    connectFirestoreEmulator(dbInstance, "localhost", 8080);
    console.log('🔧 Connected to Firestore emulator');
  } catch (error) {
    console.log('Firestore emulator connection failed:', error);
  }
} else {
  console.log('🌐 Using production Firestore (emulator disabled)');
}

console.log('✅ All Firebase services initialized synchronously');

// Export synchronous instances
export { dbInstance as db };
export { storageInstance as storage };
export { analyticsInstance as analytics };
export { authInstance as auth };

// Network error handling utility
export const handleNetworkError = (error: any) => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';

  if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
    return 'Request blocked by browser extension or ad blocker. Please disable ad blockers and try again.';
  }

  if (errorMessage.includes('ERR_NAME_NOT_RESOLVED')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }

  if (errorMessage.includes('ERR_NETWORK_IO_SUSPENDED')) {
    return 'Network connection suspended. Please check your internet connection and try again.';
  }

  if (errorMessage.includes('offline') || errorMessage.includes('network')) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }

  return errorMessage;
};