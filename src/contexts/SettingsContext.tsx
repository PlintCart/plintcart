import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface BusinessSettings {
  // Business Info
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  
  // Localization
  currency: string;
  language: string;
  timezone: string;
  
  // Payment & Fees
  deliveryFee: number;
  minimumOrder: number;
  acceptCash: boolean;
  
  // M-Pesa Integration (Backend will handle Daraja API)
  enableMpesa?: boolean;
  mpesaMethod?: 'paybill' | 'till' | 'send_money';
  paybillNumber?: string;
  accountReference?: string;
  tillNumber?: string;
  mpesaPhoneNumber?: string;
  mpesaInstructions?: string;
  
  // WhatsApp Integration
  whatsappNumber: string;
  orderMessageTemplate: string;
  autoSendOrderDetails: boolean;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingUpdates: boolean;
  
  // Storefront Design
  storeTheme: string;
  primaryColor: string;
  logoUrl: string;
  coverImageUrl: string;
  storeDescription: string;
  showBusinessInfo: boolean;
  showSocialProof: boolean;
}

export interface UserProfile {
  displayName: string;
  phoneNumber: string;
}

interface SettingsContextType {
  settings: BusinessSettings;
  profile: UserProfile;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<void>;
  updateProfile: (newProfile: Partial<UserProfile>) => Promise<void>;
  saveAllSettings: () => Promise<void>;
  resetToDefaults: () => void;
}

const defaultSettings: BusinessSettings = {
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
  currency: 'ksh',
  language: 'en',
  timezone: 'utc',
  deliveryFee: 5.00,
  minimumOrder: 10.00,
  acceptCash: true,
  
  // M-Pesa Integration defaults (Backend handles Daraja API)
  enableMpesa: false,
  mpesaMethod: 'paybill',
  paybillNumber: '',
  accountReference: '',
  tillNumber: '',
  mpesaPhoneNumber: '',
  mpesaInstructions: '',
  
  whatsappNumber: '',
  orderMessageTemplate: "Hi! I'd like to place an order:\n\n{order_details}\n\nTotal: {total_amount}\n\nPlease confirm availability.",
  autoSendOrderDetails: true,
  emailNotifications: true,
  smsNotifications: false,
  marketingUpdates: true,
  storeTheme: 'modern',
  primaryColor: '#059669',
  logoUrl: '',
  coverImageUrl: '',
  storeDescription: '',
  showBusinessInfo: true,
  showSocialProof: false,
};

const defaultProfile: UserProfile = {
  displayName: '',
  phoneNumber: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from Firebase when user changes
  useEffect(() => {
    if (user && user.id) {
      loadSettings();
      loadProfile();
    } else {
      setSettings(defaultSettings);
      setProfile(defaultProfile);
    }
  }, [user?.id]); // Only depend on user.id to prevent infinite loops

  const loadSettings = async () => {
    if (!user || !user.id) return;

    try {
      setIsLoading(true);
      const settingsDoc = await getDoc(doc(db, 'userSettings', user.id));

      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as BusinessSettings;
        setSettings({ ...defaultSettings, ...data });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Don't show toast for settings loading errors to avoid spam
      // toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async () => {
    if (!user || !user.id) return;

    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', user.id));

      if (profileDoc.exists()) {
        const data = profileDoc.data() as UserProfile;
        setProfile({ ...defaultProfile, ...data });
      } else {
        // Initialize with user data if available
        setProfile({
          displayName: user.displayName || '',
          phoneNumber: '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Don't show toast for profile loading errors to avoid spam
      // toast.error('Failed to load profile');
    }
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    if (!user || !user.id) return;

    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      // Save to both collections for compatibility
      await Promise.all([
        setDoc(doc(db, 'userSettings', user.id), updatedSettings, { merge: true }),
        setDoc(doc(db, 'settings', user.id), updatedSettings, { merge: true }) // Legacy compatibility
      ]);

      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
      // Revert changes on error
      loadSettings();
    }
  };

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    if (!user || !user.id) return;

    try {
      const updatedProfile = { ...profile, ...newProfile };
      setProfile(updatedProfile);

      await setDoc(doc(db, 'userProfiles', user.id), updatedProfile, { merge: true });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      // Revert changes on error
      loadProfile();
    }
  };

  const saveAllSettings = async () => {
    if (!user || !user.id) return;

    try {
      setIsLoading(true);

      // Save both settings and profile to both collections for compatibility
      await Promise.all([
        setDoc(doc(db, 'userSettings', user.id), settings),
        setDoc(doc(db, 'userProfiles', user.id), profile),
        setDoc(doc(db, 'settings', user.id), settings), // Legacy compatibility
      ]);

      toast.success('All settings saved successfully');
    } catch (error) {
      console.error('Error saving all settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setProfile({
      displayName: user?.displayName || '',
      phoneNumber: '',
    });
    toast.info('Settings reset to defaults');
  };

  const value = {
    settings,
    profile,
    isLoading,
    updateSettings,
    updateProfile,
    saveAllSettings,
    resetToDefaults,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
