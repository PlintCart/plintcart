// Initial setup script for production
// This would be run once to create the first store owner

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

/**
 * Production Setup Flow:
 * 
 * 1. User signs up normally through the app
 * 2. Admin manually sets their role to 'owner' using Firebase console or this script
 * 3. Owner can then invite staff through the app
 */

export const setupFirstOwner = async (email: string, password: string, merchantId: string) => {
  try {
    // This would typically be run by a super admin
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Call your set-role function to make them owner
    const response = await fetch('/api/set-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await user.getIdToken()}`
      },
      body: JSON.stringify({
        uid: user.uid,
        merchantId: merchantId, // Unique merchant identifier
        role: 'owner'
      })
    });

    if (response.ok) {
      console.log('✅ First owner setup complete');
      // Force token refresh
      await user.getIdToken(true);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

/**
 * Alternative: Merchant Registration Flow
 * 
 * When a new merchant signs up:
 * 1. They fill out merchant registration form
 * 2. System generates unique merchantId
 * 3. System automatically assigns 'owner' role
 * 4. Merchant can start inviting staff
 */

export const registerNewMerchant = async (merchantData: {
  ownerEmail: string;
  storeName: string;
  businessType: string;
}) => {
  // Generate unique merchant ID
  const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // After user creates account, automatically assign owner role
  // This would be called from your registration completion handler
  
  return { merchantId };
};
