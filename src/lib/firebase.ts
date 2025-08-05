import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC9OPkXCOT77Sb8scxxrI4U4Et8iGNhB6s",
  authDomain: "takeapp-294ca.firebaseapp.com",
  projectId: "takeapp-294ca",
  storageBucket: "takeapp-294ca.firebasestorage.app",
  messagingSenderId: "12188880002",
  appId: "1:12188880002:web:757fcdfc7406e4f063f89b",
  measurementId: "G-KYQPQQCMCS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;