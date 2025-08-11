import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase app initialized successfully');
  
  // Initialize Firebase services with error handling
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize analytics only if supported and not blocked
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics initialized');
    } else {
      console.log('📊 Firebase Analytics not supported in this environment');
    }
  }).catch((error) => {
    console.log('📊 Firebase Analytics blocked or unavailable:', error.message);
  });
  
} catch (error) {
  console.error('🔥 Firebase initialization error:', error);
  throw new Error('Firebase initialization failed. Please check your network connection and try again.');
}

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

export { auth, db, storage, analytics };
export default app;