// Production-ready role utilities for Firebase auth
import { getUserRole as getFirebaseUserRole } from '@/lib/roles';
import type { EnokiUser } from '@/contexts/AuthContext';

export const getUserRole = async (user: EnokiUser | null): Promise<string | null> => {
  if (!user) return null;

  try {
    const role = await getFirebaseUserRole(user.id);
    console.log('🔥 Using Firebase role:', role);
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const getUserMerchantId = async (user: EnokiUser | null): Promise<string | null> => {
  if (!user) return null;

  // For Firebase auth, create merchantId based on user ID
  const merchantId = 'merchant-' + user.id;
  console.log('🔧 Using Firebase merchantId:', merchantId);
  return merchantId;
};
