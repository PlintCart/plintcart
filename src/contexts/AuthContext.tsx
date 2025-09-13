import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnectWallet, useCurrentAccount, useWallets, useDisconnectWallet } from '@mysten/dapp-kit';
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki';
import { toast } from 'sonner';
import { createOrUpdateUser } from '@/lib/roles';
import { auth } from '@/lib/firebase';
import { signInWithWallet } from '@/lib/authBridge';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Feature flag for auth provider - defaults to Firebase
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || 'firebase';

// User type for Enoki (fallback) / Firebase (primary)
export interface EnokiUser {
  id: string;
  uid: string; // Add uid for backwards compatibility with existing code
  address?: string; // Optional for Firebase mode
  email?: string | null;
  displayName?: string;
}

interface AuthContextType {
  user: EnokiUser | null;
  loading: boolean;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<EnokiUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Enoki-specific hooks (only used when AUTH_PROVIDER === 'enoki')
  const currentAccount = AUTH_PROVIDER === 'enoki' ? useCurrentAccount() : null;
  const wallets = AUTH_PROVIDER === 'enoki' ? useWallets().filter(isEnokiWallet) : [];
  const { mutateAsync: connect } = AUTH_PROVIDER === 'enoki' ? useConnectWallet() : { mutateAsync: async () => {} };
  const { mutateAsync: disconnect } = AUTH_PROVIDER === 'enoki' ? useDisconnectWallet() : { mutateAsync: async () => {} };

  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  );

  const googleWallet = walletsByProvider.get('google');
  const facebookWallet = walletsByProvider.get('facebook');

  // Firebase mode: Listen to auth state changes
  useEffect(() => {
    if (AUTH_PROVIDER !== 'firebase') return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const userData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          address: undefined, // No wallet address in Firebase mode
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email || `User ${fbUser.uid.slice(0, 6)}...`,
        };
        setUser(userData);

        // Create or update user document in Firestore
        try {
          await createOrUpdateUser({
            userId: fbUser.uid,
            displayName: userData.displayName,
            provider: 'google',
            email: userData.email,
          });
          console.log('✅ Firebase user document created/updated:', {
            userId: fbUser.uid,
            email: userData.email,
            displayName: userData.displayName
          });
        } catch (error) {
          console.error('❌ Failed to sync Firebase user to Firestore:', error);
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Enoki mode: Update user state when account changes
  useEffect(() => {
    if (AUTH_PROVIDER !== 'enoki') return;
  const handleAccountChange = async () => {
      if (currentAccount) {
        // Try to get user info from the connected wallet
        let userEmail: string | null = null;
        let userDisplayName: string | null = null;

        // Check if this is from a social provider (Google/Facebook)
        const connectedWallet = wallets.find(w => w.accounts.some(acc => acc.address === currentAccount.address));
        let provider: 'wallet' | 'google' | 'facebook' = 'wallet';
        
        if (connectedWallet) {
          provider = connectedWallet.provider as 'wallet' | 'google' | 'facebook';
          
          // For social providers, create reasonable defaults since Enoki claims aren't available
          if (connectedWallet.provider === 'google') {
            // Since Enoki claims are not available, use fallback values
            userEmail = `google.user.${currentAccount.address.slice(0, 8)}@enoki.wallet`; // Unique email
            userDisplayName = `Google User ${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`;
            
            console.log('🔍 Google provider detected, using fallback data:', { 
              provider, 
              email: userEmail,
              displayName: userDisplayName 
            });
          } else if (connectedWallet.provider === 'facebook') {
            userEmail = `facebook.user.${currentAccount.address.slice(0, 8)}@enoki.wallet`; // Unique email
            userDisplayName = `Facebook User ${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`;
            
            console.log('🔍 Facebook provider detected, using fallback data:', { 
              provider, 
              email: userEmail,
              displayName: userDisplayName 
            });
          }
        }

        // Ensure Firebase custom token sign-in (only if not already signed in)
  try {
          if (auth.currentUser?.uid !== currentAccount.address) {
            await signInWithWallet(currentAccount.address, provider);
          }
        } catch (e) {
          console.error('Failed Firebase custom token sign-in:', e);
        }

        // Create user data with actual values (no undefined values)
        const userData = {
          id: currentAccount.address, // Use wallet address as unique ID
          uid: currentAccount.address, // Add uid for backwards compatibility
          address: currentAccount.address,
          email: userEmail, // Always has a value now
          displayName: userDisplayName || `User ${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`,
        };

        // Only update if user data has actually changed
        setUser(prevUser => {
          if (!prevUser || 
              prevUser.address !== userData.address || 
              prevUser.email !== userData.email || 
              prevUser.displayName !== userData.displayName) {
            return userData;
          }
          return prevUser;
        });

        // Create or update user document in Firestore (only if user changed)
        try {
          await createOrUpdateUser({
            userId: currentAccount.address,
            displayName: userData.displayName,
            provider: provider === 'wallet' ? 'email' : provider,
            email: userData.email, // This will always have a value now
          });
          console.log('✅ User document created/updated in Firestore:', {
            provider,
            email: userData.email,
            displayName: userData.displayName,
            userId: currentAccount.address
          });
        } catch (error) {
          console.error('❌ Error creating/updating user (possibly before auth ready):', error);
        }
      } else {
        setUser(null);
      }
      // Mark auth as initialized after processing the account (present or not)
      setAuthReady(true);
    };

    handleAccountChange();
  }, [currentAccount?.address]); // Only depend on the account address to prevent unnecessary re-runs

  // Auth functions that work in both modes
  const signIn = async (email: string, password: string) => {
    if (AUTH_PROVIDER === 'firebase') {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('✅ Sign-in successful!');
      } catch (error: any) {
        console.error('Email/password sign-in error:', error);
        toast.error(error.message || 'Failed to sign in');
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Please use wallet connection for authentication.');
      throw new Error('Use wallet connection instead');
    }
  };

  const signUp = async (email: string, password: string) => {
    if (AUTH_PROVIDER === 'firebase') {
      setLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('✅ Account created successfully!');
      } catch (error: any) {
        console.error('Email/password sign-up error:', error);
        toast.error(error.message || 'Failed to create account');
        throw error;
      } finally {
        setLoading(false);
      }
    } else {
      toast.error('Please use wallet connection for authentication.');
      throw new Error('Use wallet connection instead');
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    
    try {
      if (AUTH_PROVIDER === 'firebase') {
        // Firebase Google sign-in
        console.log('🔐 Attempting Google Sign-In with Firebase...');
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        toast.success('✅ Google Sign-In successful!');
        return;
      } else {
        // Enoki Google sign-in (existing logic)
        if (!googleWallet) {
          toast.error('Google wallet not available. Please ensure Enoki is properly configured.');
          throw new Error('Google wallet not available');
        }

        console.log('🔐 Attempting Google Sign-In with Enoki...');

        // Actually connect to Google wallet (not development mode)
        const result = await connect({ wallet: googleWallet });
        toast.success('✅ Google Sign-In successful! Wallet connected.');

        // Wait briefly for Firebase custom token sign-in to complete (effect triggers it)
        try {
          const target = currentAccount?.address;
          const timeoutMs = 6000;
          const start = Date.now();
          while (target && auth.currentUser?.uid !== target && Date.now() - start < timeoutMs) {
            await new Promise((r) => setTimeout(r, 150));
          }
          if (target && auth.currentUser?.uid === target) {
            console.log('✅ Firebase auth matched connected Google wallet');
          } else {
            console.warn('⚠️ Firebase auth did not match wallet within timeout');
          }
        } catch (waitErr) {
          console.warn('⚠️ Error waiting for Firebase auth after Google connect:', waitErr);
        }
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Enoki development fallback (only in enoki mode)
      if (AUTH_PROVIDER === 'enoki' && (
          error.message?.includes('network is not enabled') ||
          error.message?.includes('Invalid API key') ||
          error.message?.includes('API key') ||
          error.message?.includes('network'))) {
        console.log('⚠️ Enoki API key/network issue detected. Offering development fallback...');

        // Development fallback: Create mock user for testing
        const mockUser = {
          id: 'dev-user-' + Date.now(),
          uid: 'dev-user-' + Date.now(),
          address: '0x' + Math.random().toString(16).substr(2, 40),
          email: 'dev@example.com',
          displayName: 'Development User',
        };

        setUser(mockUser);

        // Create user document in Firestore
        try {
          await createOrUpdateUser({
            userId: mockUser.id,
            displayName: mockUser.displayName,
            provider: 'google',
            email: mockUser.email,
          });
          toast.success('⚠️ Development mode: User created successfully!');
          console.log('✅ Development user created due to API issues');
        } catch (firestoreError) {
          console.error('❌ Error creating dev user:', firestoreError);
          toast.error('Failed to create development user');
        }

        return;
      }

      toast.error('❌ Failed to sign in with Google.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    if (AUTH_PROVIDER === 'firebase') {
      toast.error('Facebook sign-in not implemented for Firebase mode.');
      throw new Error('Facebook sign-in not implemented for Firebase mode');
    }

    if (!facebookWallet) {
      toast.error('Facebook wallet not available. Please ensure Enoki is properly configured.');
      throw new Error('Facebook wallet not available');
    }

    try {
      setLoading(true);
      await connect({ wallet: facebookWallet });
      toast.success('Facebook Sign-In successful!');

      // Wait briefly for Firebase custom token sign-in to complete (effect triggers it)
      try {
        const target = currentAccount?.address;
        const timeoutMs = 6000;
        const start = Date.now();
        while (target && auth.currentUser?.uid !== target && Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, 150));
        }
        if (target && auth.currentUser?.uid === target) {
          console.log('✅ Firebase auth matched connected Facebook wallet');
        } else {
          console.warn('⚠️ Firebase auth did not match wallet within timeout');
        }
      } catch (waitErr) {
        console.warn('⚠️ Error waiting for Firebase auth after Facebook connect:', waitErr);
      }
    } catch (error) {
      console.error('Facebook Sign-In error:', error);
      toast.error('Failed to sign in with Facebook.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Only redirect when on auth page and user is logged in
  React.useEffect(() => {
    if (user && window.location.pathname === '/auth') {
      console.log('🔄 User logged in and on auth page, redirecting to admin...');
      navigate('/admin');
    }
  }, [user, navigate]);

  const logout = async () => {
    try {
      if (AUTH_PROVIDER === 'firebase') {
        await signOut(auth);
        setUser(null);
      } else {
        await disconnect();
        setUser(null);
      }
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
  authReady,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}