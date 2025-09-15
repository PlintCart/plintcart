import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentTransaction {
  id: string;
  orderId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'mpesa' | 'cash';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  customerName?: string;
  customerPhone?: string;
  mpesaReceiptNumber?: string;
  checkoutRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
}

export interface WalletStats {
  totalPaymentsProcessed: number;
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  mpesaPayments: number;
  cashPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
}

export function useWalletData() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    totalPaymentsProcessed: 0,
    totalRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    mpesaPayments: 0,
    cashPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchWalletData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch orders (primary source of payment data)
        const ordersQuery = query(
          collection(db, 'orders'),
          where('businessOwnerId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const orderTransactions: PaymentTransaction[] = [];

        ordersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.paymentStatus && data.paymentStatus !== 'unpaid') {
            orderTransactions.push({
              id: doc.id,
              orderId: doc.id,
              amount: data.total || 0,
              currency: data.currency || 'KES',
              paymentMethod: data.paymentMethod || 'mpesa',
              status: mapPaymentStatus(data.paymentStatus, data.status),
              customerName: data.customerName,
              customerPhone: data.customerPhone,
              mpesaReceiptNumber: data.mpesaReceiptNumber,
              checkoutRequestId: data.checkoutRequestId,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              description: `Order for ${data.items?.[0]?.name || 'Product'}`,
            });
          }
        });

        // Fetch additional payment records
        const paymentsQuery = query(
          collection(db, 'payments'),
          where('orderId', 'in', orderTransactions.map(t => t.orderId).filter(Boolean).slice(0, 10)) // Firestore limit
        );

        try {
          const paymentsSnapshot = await getDocs(paymentsQuery);
          const paymentRecords = new Map();
          
          paymentsSnapshot.forEach((doc) => {
            const data = doc.data();
            paymentRecords.set(data.orderId, {
              mpesaReceiptNumber: data.mpesaReceipt,
              checkoutRequestId: data.checkoutRequestId,
              mpesaPhoneNumber: data.mpesaPhoneNumber,
            });
          });

          // Enhance order transactions with payment data
          orderTransactions.forEach(transaction => {
            const paymentData = paymentRecords.get(transaction.orderId);
            if (paymentData) {
              transaction.mpesaReceiptNumber = paymentData.mpesaReceiptNumber || transaction.mpesaReceiptNumber;
              transaction.checkoutRequestId = paymentData.checkoutRequestId || transaction.checkoutRequestId;
            }
          });
        } catch (paymentError) {
          console.warn('Could not fetch payment records:', paymentError);
        }

        setTransactions(orderTransactions);
        calculateStats(orderTransactions);

      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();

    // Set up real-time listener for new orders
    const ordersListener = query(
      collection(db, 'orders'),
      where('businessOwnerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(ordersListener, (snapshot) => {
      let hasChanges = false;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          hasChanges = true;
        }
      });

      if (hasChanges) {
        fetchWalletData(); // Refresh data when changes detected
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const calculateStats = (transactionList: PaymentTransaction[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newStats: WalletStats = {
      totalPaymentsProcessed: transactionList.length,
      totalRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      mpesaPayments: 0,
      cashPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0,
    };

    transactionList.forEach(transaction => {
      // Count by payment method
      if (transaction.paymentMethod === 'mpesa') {
        newStats.mpesaPayments++;
      } else if (transaction.paymentMethod === 'cash') {
        newStats.cashPayments++;
      }

      // Count by status
      if (transaction.status === 'completed') {
        newStats.successfulPayments++;
        newStats.totalRevenue += transaction.amount;

        // Weekly revenue
        if (transaction.createdAt >= oneWeekAgo) {
          newStats.weeklyRevenue += transaction.amount;
        }

        // Monthly revenue
        if (transaction.createdAt >= oneMonthAgo) {
          newStats.monthlyRevenue += transaction.amount;
        }
      } else if (transaction.status === 'failed') {
        newStats.failedPayments++;
      } else if (transaction.status === 'pending') {
        newStats.pendingPayments++;
      }
    });

    setStats(newStats);
  };

  const mapPaymentStatus = (paymentStatus: string, orderStatus: string): PaymentTransaction['status'] => {
    // Map various payment statuses to our standard format
    if (paymentStatus === 'completed' || 
        paymentStatus === 'paid' || 
        paymentStatus === 'cod_confirmed' ||
        orderStatus === 'completed' ||
        orderStatus === 'confirmed') {
      return 'completed';
    }
    
    if (paymentStatus === 'failed' || 
        paymentStatus === 'stk_failed' ||
        paymentStatus === 'timeout' ||
        orderStatus === 'cancelled') {
      return 'failed';
    }
    
    if (paymentStatus === 'cancelled') {
      return 'cancelled';
    }
    
    return 'pending';
  };

  const getRecentTransactions = (count: number = 5) => {
    return transactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count);
  };

  const getWeeklyTrend = () => {
    const dailyRevenue = new Map<string, number>();
    const now = new Date();
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toLocaleDateString();
      dailyRevenue.set(dateKey, 0);
    }

    // Add actual revenue data
    transactions
      .filter(t => t.status === 'completed')
      .forEach(transaction => {
        const dateKey = transaction.createdAt.toLocaleDateString();
        if (dailyRevenue.has(dateKey)) {
          dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) || 0) + transaction.amount);
        }
      });

    return Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  };

  const refreshData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    setError(null);

    try {
      // Re-fetch data
      const ordersQuery = query(
        collection(db, 'orders'),
        where('businessOwnerId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orderTransactions: PaymentTransaction[] = [];

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.paymentStatus && data.paymentStatus !== 'unpaid') {
          orderTransactions.push({
            id: doc.id,
            orderId: doc.id,
            amount: data.total || 0,
            currency: data.currency || 'KES',
            paymentMethod: data.paymentMethod || 'mpesa',
            status: mapPaymentStatus(data.paymentStatus, data.status),
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            mpesaReceiptNumber: data.mpesaReceiptNumber,
            checkoutRequestId: data.checkoutRequestId,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            description: `Order for ${data.items?.[0]?.name || 'Product'}`,
          });
        }
      });

      setTransactions(orderTransactions);
      calculateStats(orderTransactions);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return {
    transactions,
    stats,
    loading,
    error,
    getRecentTransactions,
    getWeeklyTrend,
    refreshData,
    mapPaymentStatus
  };
}
