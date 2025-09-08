import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase services instances
let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

// Initialize Firebase app lazily
const initializeFirebase = async (): Promise<FirebaseApp> => {
  if (app) return app;

  try {
    const { initializeApp } = await import("firebase/app");
    app = initializeApp(firebaseConfig);
    console.log('🔥 Firebase app initialized successfully');
    return app;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

// Auth service removed - replaced with zklogin

// Initialize Firestore service
const initializeFirestore = async (): Promise<Firestore> => {
  if (dbInstance) return dbInstance;
  
  const firebaseApp = await initializeFirebase();
  const { getFirestore, connectFirestoreEmulator } = await import("firebase/firestore");
  dbInstance = getFirestore(firebaseApp);
  
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectFirestoreEmulator(dbInstance, "localhost", 8080);
      console.log('🔧 Connected to Firestore emulator');
    } catch (error) {
      console.log('Firestore emulator connection failed:', error);
    }
  }
  
  return dbInstance;
};

// Initialize Storage service
const initializeStorage = async (): Promise<FirebaseStorage> => {
  if (storageInstance) return storageInstance;
  
  const firebaseApp = await initializeFirebase();
  const { getStorage } = await import("firebase/storage");
  storageInstance = getStorage(firebaseApp);
  return storageInstance;
};

// Initialize Analytics service
const initializeAnalytics = async (): Promise<Analytics | null> => {
  if (analyticsInstance) return analyticsInstance;
  
  try {
    const firebaseApp = await initializeFirebase();
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    
    if (await isSupported()) {
      analyticsInstance = getAnalytics(firebaseApp);
      console.log('📊 Firebase Analytics initialized');
      return analyticsInstance;
    }
  } catch (error) {
    console.log('📊 Firebase Analytics blocked or unavailable:', error);
  }
  
  return null;
};

// Synchronous lazy getters for backwards compatibility
let dbPromise: Promise<Firestore> | null = null;
let storagePromise: Promise<FirebaseStorage> | null = null;

export const getFirestore = (): Promise<Firestore> => {
  if (!dbPromise) {
    dbPromise = initializeFirestore();
  }
  return dbPromise;
};

export const getStorage = (): Promise<FirebaseStorage> => {
  if (!storagePromise) {
    storagePromise = initializeStorage();
  }
  return storagePromise;
};

export const getAnalytics = (): Promise<Analytics | null> => {
  return initializeAnalytics();
};

// Legacy synchronous exports (will be undefined initially, then populated)
export let db: Firestore;
export let storage: FirebaseStorage;

// Initialize synchronous exports on first import (but don't block)
getFirestore().then(instance => {
  db = instance;
});

getStorage().then(instance => {
  storage = instance;
});

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

export default initializeFirebase;
