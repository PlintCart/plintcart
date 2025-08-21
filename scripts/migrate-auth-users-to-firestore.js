// Migration script: Add missing Firestore user documents for all Firebase Auth users
// Run this with Node.js (requires firebase-admin SDK)

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

async function migrateUsers() {
  let nextPageToken;
  let totalCreated = 0;
  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    for (const userRecord of listUsersResult.users) {
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();
      if (!userDoc.exists) {
        await userDocRef.set({
          email: userRecord.email || '',
          createdAt: new Date(),
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
        });
        totalCreated++;
        console.log(`Created Firestore user for UID: ${userRecord.uid}`);
      }
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  console.log(`Migration complete. Created ${totalCreated} new Firestore user documents.`);
}

migrateUsers().catch(console.error);
