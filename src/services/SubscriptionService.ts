// REAL Subscription Service with M-Pesa Integration
import { MpesaService } from './MpesaService';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date | null;
  endDate: Date | null;
  autoRenew: boolean;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  status: 'completed' | 'failed' | 'pending';
  mpesaReference?: string;
  checkoutRequestId?: string;
}

export class SubscriptionService {
  private static readonly PREMIUM_PRICE = 2600; // KES per month
  
  /**
   * Get user's current subscription status
   */
  static async getUserSubscription(userId: string): Promise<SubscriptionStatus> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          tier: userData.subscriptionTier || 'free',
          status: userData.subscriptionStatus || 'active',
          startDate: userData.subscriptionStart?.toDate() || null,
          endDate: userData.subscriptionEnd?.toDate() || null,
          autoRenew: userData.autoRenew || false,
          paymentHistory: userData.paymentHistory || []
        };
      }
      
      // Default subscription for new users
      return {
        tier: 'free',
        status: 'active',
        startDate: null,
        endDate: null,
        autoRenew: false,
        paymentHistory: []
      };
    } catch (error) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  }

  /**
   * Initiate premium subscription payment
   */
  static async subscribeToPremium(userId: string, phoneNumber: string, userEmail: string) {
    try {
      console.log('🎯 Initiating premium subscription for:', userId);
      
      // Create subscription payment request
      const paymentRequest = {
        phoneNumber: phoneNumber,
        amount: this.PREMIUM_PRICE,
        orderId: `SUBSCRIPTION_${userId}_${Date.now()}`,
        description: `Premium Subscription - CSS Whisperer Pro`,
        merchantSettings: {
          enableMpesa: true,
          mpesaMethod: 'paybill' as const
        }
      };

      console.log('💳 Initiating subscription payment:', paymentRequest);
      
      // Call M-Pesa service
      const paymentResult = await MpesaService.initiatePayment(paymentRequest);
      
      if (paymentResult.success) {
        // Store pending subscription
        await this.storePendingSubscription(userId, {
          checkoutRequestId: paymentResult.transactionId!,
          amount: this.PREMIUM_PRICE,
          phoneNumber: phoneNumber,
          email: userEmail
        });
        
        // Start monitoring payment status
        this.monitorSubscriptionPayment(userId, paymentResult.transactionId!);
        
        return {
          success: true,
          checkoutRequestId: paymentResult.transactionId,
          message: 'STK push sent! Complete payment on your phone to activate premium subscription.'
        };
      } else {
        throw new Error(paymentResult.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('❌ Subscription payment error:', error);
      throw error;
    }
  }

  /**
   * Store pending subscription details
   */
  private static async storePendingSubscription(userId: string, details: any) {
    await setDoc(doc(db, 'pending_subscriptions', details.checkoutRequestId), {
      userId,
      type: 'premium_subscription',
      amount: details.amount,
      phoneNumber: details.phoneNumber,
      email: details.email,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
  }

  /**
   * Monitor subscription payment status
   */
  private static async monitorSubscriptionPayment(userId: string, checkoutRequestId: string) {
    let attempts = 0;
    const maxAttempts = 30; // Monitor for 5 minutes (30 * 10 seconds)
    
    const checkStatus = async () => {
      try {
        const statusResult = await MpesaService.checkPaymentStatus(checkoutRequestId);
        
        if (statusResult.status === 'completed') {
          // Payment successful - activate premium subscription
          await this.activatePremiumSubscription(userId, checkoutRequestId);
          console.log('✅ Premium subscription activated for:', userId);
        } else if (statusResult.status === 'failed' || statusResult.status === 'cancelled') {
          // Payment failed
          await this.handleFailedSubscriptionPayment(userId, checkoutRequestId);
          console.log('❌ Subscription payment failed for:', userId);
        } else if (attempts < maxAttempts) {
          // Still pending, check again
          attempts++;
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          // Timeout
          await this.handleFailedSubscriptionPayment(userId, checkoutRequestId);
          console.log('⏰ Subscription payment timeout for:', userId);
        }
      } catch (error) {
        console.error('Error monitoring subscription payment:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 10000);
        }
      }
    };

    // Start monitoring
    setTimeout(checkStatus, 5000); // First check after 5 seconds
  }

  /**
   * Activate premium subscription after successful payment
   */
  private static async activatePremiumSubscription(userId: string, checkoutRequestId: string) {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Update user subscription
    await updateDoc(doc(db, 'users', userId), {
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
      subscriptionStart: now,
      subscriptionEnd: endDate,
      autoRenew: true,
      updatedAt: now
    });

    // Record payment
    await this.recordSubscriptionPayment(userId, {
      id: checkoutRequestId,
      amount: this.PREMIUM_PRICE,
      currency: 'KES',
      date: now,
      status: 'completed',
      checkoutRequestId: checkoutRequestId
    });

    // Clean up pending subscription
    await this.cleanupPendingSubscription(checkoutRequestId);
  }

  /**
   * Handle failed subscription payment
   */
  private static async handleFailedSubscriptionPayment(userId: string, checkoutRequestId: string) {
    // Record failed payment
    await this.recordSubscriptionPayment(userId, {
      id: checkoutRequestId,
      amount: this.PREMIUM_PRICE,
      currency: 'KES',
      date: new Date(),
      status: 'failed',
      checkoutRequestId: checkoutRequestId
    });

    // Clean up pending subscription
    await this.cleanupPendingSubscription(checkoutRequestId);
  }

  /**
   * Record subscription payment in user's history
   */
  private static async recordSubscriptionPayment(userId: string, payment: PaymentRecord) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const paymentHistory = userData.paymentHistory || [];
      
      await updateDoc(userRef, {
        paymentHistory: [...paymentHistory, payment],
        updatedAt: new Date()
      });
    }
  }

  /**
   * Clean up pending subscription
   */
  private static async cleanupPendingSubscription(checkoutRequestId: string) {
    try {
      await updateDoc(doc(db, 'pending_subscriptions', checkoutRequestId), {
        status: 'processed',
        processedAt: new Date()
      });
    } catch (error) {
      console.error('Error cleaning up pending subscription:', error);
    }
  }

  /**
   * Check if user has access to premium features
   */
  static async hasPremiumAccess(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (subscription.tier === 'premium' && subscription.status === 'active') {
        // Check if subscription hasn't expired
        if (subscription.endDate && subscription.endDate > new Date()) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(userId: string) {
    await updateDoc(doc(db, 'users', userId), {
      subscriptionStatus: 'cancelled',
      autoRenew: false,
      updatedAt: new Date()
    });
  }
}
