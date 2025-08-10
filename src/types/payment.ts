export type PaymentStatus = 'unpaid' | 'pending' | 'authorizing' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentInfo {
  paymentStatus: PaymentStatus;
  paymentMethod?: 'mpesa' | 'card' | 'wallet' | 'subscription';
  paymentProvider?: 'swypt';
  paymentRef?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  settlementStatus?: 'none' | 'settling' | 'settled' | 'reversed';
  paymentMeta?: Record<string, any>;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'cancelling' | 'cancelled' | 'expired';
  lastPaymentCheckAt?: Date;
}
