// Firebase Admin SDK setup for Netlify Functions
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Optionally set databaseURL if using RTDB
    // databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

module.exports = admin;
