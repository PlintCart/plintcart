// Temporary utility to set user role for testing
import { auth } from '@/lib/firebase';

// Simple localStorage-based role storage for development
export const setTestRole = async (role: string = 'owner') => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No user logged in');
    return;
  }

  try {
    // Store role in localStorage for development
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    const merchantId = 'test-merchant-' + user.uid;
    
    userRoles[user.uid] = {
      role: role,
      merchantId: merchantId,
      email: user.email,
      assignedAt: new Date().toISOString()
    };
    localStorage.setItem('userRoles', JSON.stringify(userRoles));
    
    console.log(`✅ Role set to ${role} successfully (stored locally for development)`);
    console.log(`🏪 MerchantId: ${merchantId}`);
    
    // Trigger a re-render by dispatching a custom event
    window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role } }));
    
  } catch (error) {
    console.error('Error setting role:', error);
  }
};

// Get role from localStorage
export const getTestRole = (uid: string): string | null => {
  try {
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '{}');
    return userRoles[uid]?.role || null;
  } catch {
    return null;
  }
};

// Clear all test roles
export const clearTestRoles = () => {
  localStorage.removeItem('userRoles');
  console.log('🧹 All test roles cleared');
  window.dispatchEvent(new CustomEvent('roleChanged', { detail: { role: null } }));
};

// Make it available globally for testing
(window as any).setTestRole = setTestRole;
(window as any).clearTestRoles = clearTestRoles;
