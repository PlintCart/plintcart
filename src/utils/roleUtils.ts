// Production-ready role utilities for zkLogin
import { getUserRole as getZkUserRole } from '@/lib/zkRoles';
import type { EnokiUser } from '@/contexts/AuthContext';

export const getUserRole = async (user: EnokiUser | null): Promise<string | null> => {
  if (!user) return null;

  try {
    const role = await getZkUserRole(user.id);
    console.log('🏭 Using zkLogin role:', role);
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

export const getUserMerchantId = async (user: EnokiUser | null): Promise<string | null> => {
  if (!user) return null;

  // For zkLogin, create merchantId based on user ID
  const merchantId = 'merchant-' + user.id;
  console.log('🔧 Using zkLogin merchantId:', merchantId);
  return merchantId;
};
