// Firebase role management utilities
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Role = 'owner' | 'super_admin' | 'staff';

export interface UserData {
  userId: string;
  uid: string;
  email?: string;
  displayName?: string;
  provider: 'google' | 'facebook' | 'email';
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
      // Determine role based on email
      let userRole: Role = 'owner'; // Default role for new signups
      
      if (userData.email === 'dev@plintcart.com') {
        userRole = 'super_admin';
      }
      
      // Create new user
      await setDoc(userRef, {
        uid: userData.userId,
        userId: userData.userId,
        signInTime: serverTimestamp(),
        lastSignIn: serverTimestamp(),
        isActive: true,
        role: userRole,
        provider: userData.provider || 'email',
        displayName: userData.displayName || `User ${userData.userId?.slice(0,6)}...${userData.userId?.slice(-4)}`,
        email: userData.email || null,
        staff: userRole === 'owner' ? [] : undefined, // Initialize empty staff array for owners only
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
      const userData = userDoc.data();
      
      // Special case: dev@plintcart.com always gets super_admin role
      if (userData.email === 'dev@plintcart.com') {
        return 'super_admin';
      }
      
      // If user exists but has no role, assign 'owner' role (for existing users)
      let userRole = userData.role as Role;
      if (!userRole) {
        userRole = 'owner';
        // Update the document with the new role
        await updateDoc(doc(db, 'users', userId), {
          role: userRole,
          staff: [] // Initialize empty staff array for owners
        });
        console.log('✅ Assigned default owner role to existing user:', userId);
      }
      
      return userRole;
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

// Permission system for role hierarchy
export const can = {
  // Product management
  manageProducts: (r: Role | null) => r === 'owner' || r === 'staff',
  editPrice: (r: Role | null) => r === 'owner',
  deleteProduct: (r: Role | null) => r === 'owner',
  
  // Stock management
  adjustStock: (r: Role | null) => r === 'owner' || r === 'staff',
  viewStock: (r: Role | null) => r === 'owner' || r === 'staff',
  
  // Order management  
  viewOrders: (r: Role | null) => ['owner', 'staff'].includes(r || ''),
  manageOrders: (r: Role | null) => ['owner', 'staff'].includes(r || ''),
  processRefunds: (r: Role | null) => r === 'owner',
  
  // Analytics and reporting
  viewAnalytics: (r: Role | null) => ['owner', 'staff'].includes(r || ''),
  viewDetailedAnalytics: (r: Role | null) => r === 'owner',
  
  // Staff management (owner only)
  manageStaff: (r: Role | null) => r === 'owner',
  inviteStaff: (r: Role | null) => r === 'owner',
  
  // Store management
  manageSettings: (r: Role | null) => r === 'owner',
  customizeStore: (r: Role | null) => r === 'owner',
  limitedStoreCustomization: (r: Role | null) => r === 'staff', // Basic visual changes only
  
  // Customer interaction
  respondToCustomers: (r: Role | null) => ['owner', 'staff'].includes(r || ''),
  
  // Super admin capabilities
  managePlatform: (r: Role | null) => r === 'super_admin',
  suspendVendors: (r: Role | null) => r === 'super_admin',
  viewAllVendors: (r: Role | null) => r === 'super_admin',
  accessFeedback: (r: Role | null) => r === 'super_admin',
  viewPlatformAnalytics: (r: Role | null) => r === 'super_admin',
};
