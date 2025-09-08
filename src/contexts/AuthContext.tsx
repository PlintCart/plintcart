import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnectWallet, useCurrentAccount, useWallets, useDisconnectWallet } from '@mysten/dapp-kit';
import { isEnokiWallet, type EnokiWallet, type AuthProvider } from '@mysten/enoki';
import { toast } from 'sonner';

// User type for Enoki/zkLogin
interface EnokiUser {
  id: string;
  address: string;
  email?: string;
  displayName?: string;
}

interface AuthContextType {
  user: EnokiUser | null;
  loading: boolean;
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
  const currentAccount = useCurrentAccount();
  const wallets = useWallets().filter(isEnokiWallet);
  const { mutateAsync: connect } = useConnectWallet();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const [user, setUser] = useState<EnokiUser | null>(null);
  const [loading, setLoading] = useState(false);

  const walletsByProvider = wallets.reduce(
    (map, wallet) => map.set(wallet.provider, wallet),
    new Map<AuthProvider, EnokiWallet>(),
  );

  const googleWallet = walletsByProvider.get('google');
  const facebookWallet = walletsByProvider.get('facebook');

  // Update user state when account changes
  useEffect(() => {
    if (currentAccount) {
      setUser({
        id: currentAccount.address,
        address: currentAccount.address,
        email: undefined, // zkLogin doesn't expose email directly
        displayName: `Wallet ${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`,
      });
    } else {
      setUser(null);
    }
  }, [currentAccount]);

  // Placeholder functions - Enoki handles auth through wallet connection
  const signIn = async (email: string, password: string) => {
    toast.error('Please use wallet connection for authentication.');
    throw new Error('Use wallet connection instead');
  };

  const signUp = async (email: string, password: string) => {
    toast.error('Please use wallet connection for authentication.');
    throw new Error('Use wallet connection instead');
  };

  const signInWithGoogle = async () => {
    if (!googleWallet) {
      toast.error('Google wallet not available. Please ensure Enoki is properly configured.');
      throw new Error('Google wallet not available');
    }

    try {
      setLoading(true);
      await connect({ wallet: googleWallet });
      toast.success('Google Sign-In successful!');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      toast.error('Failed to sign in with Google.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    if (!facebookWallet) {
      toast.error('Facebook wallet not available. Please ensure Enoki is properly configured.');
      throw new Error('Facebook wallet not available');
    }

    try {
      setLoading(true);
      await connect({ wallet: facebookWallet });
      toast.success('Facebook Sign-In successful!');
    } catch (error) {
      console.error('Facebook Sign-In error:', error);
      toast.error('Failed to sign in with Facebook.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Navigate to /admin when user is authenticated
  React.useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const logout = async () => {
    try {
      await disconnect();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
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