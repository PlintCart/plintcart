import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ProductSalesAnalytics {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantitySold: number;
  averageOrderValue: number;
  lastSaleDate?: Date;
  category: string;
  price: number;
}

export interface SalesMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingProducts: ProductSalesAnalytics[];
  salesByCategory: { [category: string]: number };
  revenueByCategory: { [category: string]: number };
}

export class SalesAnalyticsService {
  
  /**
   * Get most frequently bought products with revenue metrics
   * Firebase-optimized: Uses client-side aggregation to avoid complex queries
   */
  static async getMostFrequentlyBoughtProducts(
    userId: string, 
    limit: number = 10
  ): Promise<ProductSalesAnalytics[]> {
    try {
      // Get all stock transactions for "sold" type
      const transactionsRef = collection(db, 'stockTransactions');
      const transactionsQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        where('type', '==', 'sold')
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          userId: data.userId,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          ...data
        };
      });

      // Group transactions by product
      const productSalesMap = new Map<string, {
        totalSales: number;
        totalQuantitySold: number;
        lastSaleDate: Date;
        productId: string;
      }>();

      transactions.forEach(transaction => {
        const productId = transaction.productId;
        const existing = productSalesMap.get(productId);
        
        if (existing) {
          existing.totalSales += 1;
          existing.totalQuantitySold += transaction.quantity;
          if (transaction.timestamp > existing.lastSaleDate) {
            existing.lastSaleDate = transaction.timestamp;
          }
        } else {
          productSalesMap.set(productId, {
            totalSales: 1,
            totalQuantitySold: transaction.quantity,
            lastSaleDate: transaction.timestamp,
            productId
          });
        }
      });

      // Get product details for each product that has sales
      const productAnalytics: ProductSalesAnalytics[] = [];
      
      for (const [productId, salesData] of productSalesMap) {
        try {
          const productDoc = await getDoc(doc(db, 'products', productId));
          if (productDoc.exists()) {
            const product = productDoc.data();
            const totalRevenue = salesData.totalQuantitySold * (product.price || 0);
            const averageOrderValue = totalRevenue / salesData.totalSales;
            
            productAnalytics.push({
              productId,
              productName: product.name,
              totalSales: salesData.totalSales,
              totalRevenue,
              totalQuantitySold: salesData.totalQuantitySold,
              averageOrderValue,
              lastSaleDate: salesData.lastSaleDate,
              category: product.category || 'Uncategorized',
              price: product.price || 0
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch product ${productId}:`, error);
        }
      }

      // Sort by total sales (frequency) and then by revenue
      return productAnalytics
        .sort((a, b) => {
          if (b.totalSales !== a.totalSales) {
            return b.totalSales - a.totalSales; // Sort by frequency first
          }
          return b.totalRevenue - a.totalRevenue; // Then by revenue
        })
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting most frequently bought products:', error);
      return [];
    }
  }

  /**
   * Get comprehensive sales metrics
   */
  static async getSalesMetrics(userId: string): Promise<SalesMetrics> {
    try {
      const topProducts = await this.getMostFrequentlyBoughtProducts(userId, 20);
      
      const totalOrders = topProducts.reduce((sum, product) => sum + product.totalSales, 0);
      const totalRevenue = topProducts.reduce((sum, product) => sum + product.totalRevenue, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate sales by category
      const salesByCategory: { [category: string]: number } = {};
      const revenueByCategory: { [category: string]: number } = {};
      
      topProducts.forEach(product => {
        const category = product.category;
        salesByCategory[category] = (salesByCategory[category] || 0) + product.totalSales;
        revenueByCategory[category] = (revenueByCategory[category] || 0) + product.totalRevenue;
      });

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        topSellingProducts: topProducts.slice(0, 10),
        salesByCategory,
        revenueByCategory
      };
    } catch (error) {
      console.error('Error getting sales metrics:', error);
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topSellingProducts: [],
        salesByCategory: {},
        revenueByCategory: {}
      };
    }
  }

  /**
   * Get sales trends for a specific product
   */
  static async getProductSalesTrend(
    userId: string, 
    productId: string, 
    days: number = 30
  ): Promise<{ date: string; sales: number; revenue: number }[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const transactionsRef = collection(db, 'stockTransactions');
      const transactionsQuery = query(
        transactionsRef,
        where('userId', '==', userId),
        where('productId', '==', productId),
        where('type', '==', 'sold')
      );
      
      const snapshot = await getDocs(transactionsQuery);
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          productId: data.productId,
          quantity: data.quantity,
          type: data.type,
          userId: data.userId,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
          ...data
        };
      }).filter(t => t.timestamp >= startDate);

      // Get product price for revenue calculation
      const productDoc = await getDoc(doc(db, 'products', productId));
      const productPrice = productDoc.exists() ? (productDoc.data().price || 0) : 0;

      // Group by date
      const salesByDate: { [date: string]: { sales: number; revenue: number } } = {};
      
      transactions.forEach(transaction => {
        const date = transaction.timestamp.toISOString().split('T')[0];
        if (!salesByDate[date]) {
          salesByDate[date] = { sales: 0, revenue: 0 };
        }
        salesByDate[date].sales += transaction.quantity;
        salesByDate[date].revenue += transaction.quantity * productPrice;
      });

      // Convert to array and sort by date
      return Object.entries(salesByDate)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
        
    } catch (error) {
      console.error('Error getting product sales trend:', error);
      return [];
    }
  }
}
