// zkLogin role management utilities
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Role = 'vendor' | 'super_admin' | 'staff';

export interface UserData {
  userId: string;
  uid: string;
  email?: string;
  walletAddress?: string;
  displayName?: string;
  provider: 'wallet' | 'google' | 'facebook' | 'email';
  signInTime: any;
  lastSignIn: any;
  isActive: boolean;
  role?: Role;
  vendorId?: string; // For staff, points to their vendor
  staff?: string[]; // For vendors, array of staff UIDs
  assignedAt?: any;
  assignedBy?: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  vendorId: string;
  role: 'staff';
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: any;
  expiresAt: any;
}

// Create or update user document in Firestore
export const createOrUpdateUser = async (userData: Partial<UserData>): Promise<void> => {
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
      // Create new user with default 'vendor' role
      await setDoc(userRef, {
        uid: userData.userId,
        userId: userData.userId,
        signInTime: serverTimestamp(),
        lastSignIn: serverTimestamp(),
        isActive: true,
        role: 'vendor', // Default role for new signups
        provider: userData.provider || 'email',
        walletAddress: userData.walletAddress || null,
        displayName: userData.displayName || `User ${userData.userId?.slice(0,6)}...${userData.userId?.slice(-4)}`,
        email: userData.email || null,
        staff: [], // Initialize empty staff array for vendors
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
    // Check for development role override first
    if (process.env.NODE_ENV === 'development') {
      const devRole = localStorage.getItem(`dev_role_${userId}`);
      if (devRole) {
        console.log(`Development: Using override role ${devRole} for user ${userId}`);
        return devRole as Role;
      }
    }

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

// Permission system for new role hierarchy
export const can = {
  // Product management
  manageProducts: (r: Role | null) => r === 'vendor' || r === 'staff',
  editPrice: (r: Role | null) => r === 'vendor',
  deleteProduct: (r: Role | null) => r === 'vendor',
  
  // Stock management
  adjustStock: (r: Role | null) => r === 'vendor' || r === 'staff',
  viewStock: (r: Role | null) => r === 'vendor' || r === 'staff',
  
  // Order management  
  viewOrders: (r: Role | null) => ['vendor', 'staff'].includes(r || ''),
  manageOrders: (r: Role | null) => ['vendor', 'staff'].includes(r || ''),
  processRefunds: (r: Role | null) => r === 'vendor',
  
  // Analytics and reporting
  viewAnalytics: (r: Role | null) => ['vendor', 'staff'].includes(r || ''),
  viewDetailedAnalytics: (r: Role | null) => r === 'vendor',
  
  // Staff management (vendor only)
  manageStaff: (r: Role | null) => r === 'vendor',
  inviteStaff: (r: Role | null) => r === 'vendor',
  
  // Store management
  manageSettings: (r: Role | null) => r === 'vendor',
  customizeStore: (r: Role | null) => r === 'vendor',
  limitedStoreCustomization: (r: Role | null) => r === 'staff', // Basic visual changes only
  
  // Customer interaction
  respondToCustomers: (r: Role | null) => ['vendor', 'staff'].includes(r || ''),
  
  // Super admin capabilities
  managePlatform: (r: Role | null) => r === 'super_admin',
  suspendVendors: (r: Role | null) => r === 'super_admin',
  viewAllVendors: (r: Role | null) => r === 'super_admin',
  accessFeedback: (r: Role | null) => r === 'super_admin',
  viewPlatformAnalytics: (r: Role | null) => r === 'super_admin',
};

// Development helpers for testing
export const setTestRole = async () => {
  console.warn('setTestRole() disabled in hardened client.');
};

export const clearTestRole = async () => {
  console.warn('clearTestRole() disabled in hardened client.');
};
