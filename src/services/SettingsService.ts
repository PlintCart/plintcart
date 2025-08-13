import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Utility service to handle settings loading from the correct collection
 * This handles the migration from 'settings' to 'userSettings' collection
 */
export class SettingsService {
  /**
   * Load user settings from the appropriate collection
   * Tries userSettings first, then falls back to settings for backward compatibility
   */
  static async loadUserSettings(userId: string): Promise<any | null> {
    try {
      // Try userSettings collection first (current standard)
      let settingsDoc = await getDoc(doc(db, "userSettings", userId));
      
      if (!settingsDoc.exists()) {
        // Fallback to settings collection for backward compatibility
        settingsDoc = await getDoc(doc(db, "settings", userId));
      }
      
      if (settingsDoc.exists()) {
        return settingsDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error("Error loading user settings:", error);
      return null;
    }
  }

  /**
   * Load M-Pesa specific settings with proper fallback handling
   */
  static async loadMpesaSettings(userId: string): Promise<{
    enableMpesa: boolean;
    mpesaMethod: 'paybill' | 'till' | 'send_money';
    paybillNumber?: string;
    accountReference?: string;
    tillNumber?: string;
    mpesaPhoneNumber?: string;
    mpesaInstructions?: string;
  }> {
    const settings = await this.loadUserSettings(userId);
    
    if (!settings) {
      return {
        enableMpesa: false,
        mpesaMethod: 'paybill'
      };
    }

    // Handle both flat and nested format
    return {
      enableMpesa: settings.enableMpesa || settings.mpesa?.enabled || false,
      mpesaMethod: settings.mpesaMethod || settings.mpesa?.method || 'paybill',
      paybillNumber: settings.paybillNumber || settings.mpesa?.paybillNumber,
      accountReference: settings.accountReference || settings.mpesa?.accountNumber,
      tillNumber: settings.tillNumber || settings.mpesa?.tillNumber,
      mpesaPhoneNumber: settings.mpesaPhoneNumber || settings.mpesa?.phoneNumber,
      mpesaInstructions: settings.mpesaInstructions || settings.mpesa?.instructions,
    };
  }

  /**
   * Check if M-Pesa is enabled for a user
   */
  static async isMpesaEnabled(userId: string): Promise<boolean> {
    const mpesaSettings = await this.loadMpesaSettings(userId);
    return mpesaSettings.enableMpesa;
  }
}
