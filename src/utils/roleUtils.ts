// Production-ready role utilities
import { User } from 'firebase/auth';
import { getTestRole } from './testRole';

export const getUserRole = async (user: User | null): Promise<string | null> => {
  if (!user) return null;

  // In development, check localStorage first
  if (process.env.NODE_ENV === 'development') {
    const localRole = getTestRole(user.uid);
    if (localRole) {
      console.log('🔧 Using development role:', localRole);
      return localRole;
    }
  }

  try {
    // Production: get from Firebase custom claims
    await user.getIdToken(true); // Force refresh
    const idTokenResult = await user.getIdTokenResult();
    const role = idTokenResult.claims.role as string;
    
    if (role) {
      console.log('🏭 Using production role:', role);
      return role;
    }
  } catch (error) {
    console.error('Error getting user role:', error);
  }

  return null;
};

export const getUserMerchantId = async (user: User | null): Promise<string | null> => {
  if (!user) return null;

  // In development, check localStorage first
  if (process.env.NODE_ENV === 'development') {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const localUserData = userRoles[user.uid];
    if (localUserData?.merchantId) {
      console.log('🔧 Using development merchantId:', localUserData.merchantId);
      return localUserData.merchantId;
    }
  }

  try {
    // Production: get from Firebase custom claims
    const idTokenResult = await user.getIdTokenResult();
    const merchantId = idTokenResult.claims.merchantId as string;
    
    if (merchantId) {
      console.log('🏭 Using production merchantId:', merchantId);
      return merchantId;
    }
  } catch (error) {
    console.error('Error getting merchantId:', error);
  }

  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    const fallbackMerchantId = 'test-merchant-' + user.uid;
    console.log('🔧 Using fallback development merchantId:', fallbackMerchantId);
    return fallbackMerchantId;
  }

  return null;
};
