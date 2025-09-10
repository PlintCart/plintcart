// zkLogin role management utilities
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Role = 'owner' | 'manager' | 'staff' | 'cashier';

export interface UserData {
  userId: string;
  email?: string;
  walletAddress: string;
  displayName?: string;
  provider: 'wallet' | 'google' | 'facebook';
  signInTime: any;
  lastSignIn: any;
  isActive: boolean;
  role?: Role;
  merchantId?: string;
  assignedAt?: any;
  assignedBy?: string;
}

// Create or update user document in Firestore
export const createOrUpdateUser = async (userData: Partial<UserData>): Promise<void> => {
  // Client no longer sets or escalates roles; backend mint function owns role assignment.
  try {
    const userRef = doc(db, 'users', userData.userId!);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      // Only update non-privileged fields
      const { displayName, email, provider } = userData;
      await updateDoc(userRef, {
        lastSignIn: serverTimestamp(),
        isActive: true,
        ...(displayName ? { displayName } : {}),
        ...(email ? { email } : {}),
        ...(provider ? { provider } : {}),
      });
    } else {
      // Create minimal doc; backend will patch role and merchantId on mint
      await setDoc(userRef, {
        signInTime: serverTimestamp(),
        lastSignIn: serverTimestamp(),
        isActive: true,
        provider: userData.provider || 'wallet',
        walletAddress: userData.walletAddress || userData.userId,
        userId: userData.userId,
        displayName: userData.displayName || `User ${userData.userId?.slice(0,6)}...${userData.userId?.slice(-4)}`,
        email: userData.email || null,
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error creating/updating user (non-privileged fields):', error);
    // Swallow errors to avoid breaking auth flow; role assignment handled server-side
  }
};

// Get user role from Firestore
export const getUserRole = async (userId: string): Promise<Role | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role as Role || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Get user's merchant ID from Firestore
export const getUserMerchantId = async (userId: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().merchantId || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user merchant ID:', error);
    return null;
  }
};

// Set user role in Firestore
// setUserRole is deprecated on client to prevent escalation; retain stub (no-op)
export const setUserRole = async () => {
  console.warn('setUserRole() is now a server-managed operation. Ignored on client.');
};

// Permission system (same as before)
export const can = {
  manageProducts: (r: Role | null) => r === 'owner' || r === 'manager' || r === 'staff',
  editPrice: (r: Role | null) => r === 'owner' || r === 'manager',
  deleteProduct: (r: Role | null) => r === 'owner' || r === 'manager',
  manageOrders: (r: Role | null) => ['owner', 'manager', 'staff', 'cashier'].includes(r || ''),
  refund: (r: Role | null) => r === 'owner' || r === 'manager',
  viewAnalytics: (r: Role | null) => r === 'owner' || r === 'manager' || r === 'staff',
  adjustStock: (r: Role | null) => r === 'owner' || r === 'manager' || r === 'staff',
  manageStaff: (r: Role | null) => r === 'owner',
  manageSettings: (r: Role | null) => r === 'owner' || r === 'manager',
};

// Development helpers for testing
export const setTestRole = async () => {
  console.warn('setTestRole() disabled in hardened client.');
};

export const clearTestRole = async () => {
  console.warn('clearTestRole() disabled in hardened client.');
};
