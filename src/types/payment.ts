export type PaymentStatus = 'unpaid' | 'pending' | 'authorizing' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentInfo {
  paymentStatus: PaymentStatus;
  paymentMethod?: 'mpesa' | 'card' | 'wallet' | 'subscription' | 'cash';
  paymentProvider?: 'swypt' | 'daraja';
  paymentRef?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  settlementStatus?: 'none' | 'settling' | 'settled' | 'reversed';
  paymentMeta?: Record<string, any>;
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'cancelling' | 'cancelled' | 'expired';
  lastPaymentCheckAt?: Date;
}

// Extended interfaces for M-Pesa and checkout
export interface Order extends PaymentInfo {
  id?: string;
  orderId: string;
  amount: number;
  currency: string;
  
  // M-Pesa specific fields
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
  checkoutRequestId?: string;
  
  // Order details
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: OrderItem[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // Additional fields
  notes?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface CheckoutData {
  items: OrderItem[];
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  paymentMethod: 'mpesa' | 'cash';
  deliveryFee?: number;
  total: number;
  notes?: string;
}

export interface MpesaPaymentResult {
  success: boolean;
  orderId: string;
  checkoutRequestId?: string;
  message: string;
  instructions?: string;
}
