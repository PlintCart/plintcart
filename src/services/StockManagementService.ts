import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, addDoc, query, where, orderBy, getDocs, getDoc, writeBatch } from 'firebase/firestore';
import { Product, StockTransaction } from '@/types/product';

export interface StockUpdateData {
  quantity: number;
  reason: string;
  type: 'addition' | 'subtraction' | 'adjustment' | 'sold' | 'returned' | 'damaged';
  notes?: string;
}

export interface StockStatistics {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageStockLevel: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    currentStock: number;
  }>;
}

export class StockManagementService {
  /**
   * Update stock quantity for a product
   */
  async updateStock(
    productId: string, 
    newQuantity: number, 
    reason: string = 'Manual update',
    type: StockUpdateData['type'] = 'adjustment',
    notes?: string
  ): Promise<void> {
    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }

      const product = productSnap.data() as Product;
      const oldQuantity = product.stockQuantity || 0;
      const quantityChange = newQuantity - oldQuantity;

      // Determine stock status
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (product.trackStock) {
        if (newQuantity === 0) {
          stockStatus = 'out_of_stock';
        } else if (newQuantity <= (product.minStockLevel || 0)) {
          stockStatus = 'low_stock';
        }
      }

      // Update product stock
      await updateDoc(productRef, {
        stockQuantity: newQuantity,
        stockStatus,
        updatedAt: new Date()
      });

      // Create stock transaction record
      await this.createStockTransaction(productId, {
        quantity: Math.abs(quantityChange),
        reason,
        type,
        notes
      }, oldQuantity, newQuantity);

    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Add stock to a product
   */
  async addStock(
    productId: string, 
    quantity: number, 
    reason: string = 'Stock added',
    type: StockUpdateData['type'] = 'addition',
    notes?: string
  ): Promise<void> {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const product = productSnap.data() as Product;
    const currentStock = product.stockQuantity || 0;
    const newStock = currentStock + quantity;

    await this.updateStock(productId, newStock, reason, type, notes);
  }

  /**
   * Remove stock from a product
   */
  async removeStock(
    productId: string, 
    quantity: number, 
    reason: string = 'Stock removed',
    type: StockUpdateData['type'] = 'sold',
    notes?: string
  ): Promise<void> {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }

    const product = productSnap.data() as Product;
    const currentStock = product.stockQuantity || 0;
    
    if (currentStock < quantity && !product.allowBackorders) {
      throw new Error('Insufficient stock available');
    }

    const newStock = Math.max(0, currentStock - quantity);
    await this.updateStock(productId, newStock, reason, type, notes);
  }

  /**
   * Create a stock transaction record
   */
  private async createStockTransaction(
    productId: string,
    updateData: StockUpdateData,
    oldQuantity: number,
    newQuantity: number
  ): Promise<void> {
    const transaction: Omit<StockTransaction, 'id'> = {
      productId,
      type: updateData.type,
      quantity: updateData.quantity,
      previousStock: oldQuantity,
      newStock: newQuantity,
      reason: updateData.reason,
      timestamp: new Date(),
      userId: 'system', // Will be updated when user auth is implemented
    };

    await addDoc(collection(db, 'stockTransactions'), transaction);
  }

  /**
   * Get stock history for a product
   */
  async getStockHistory(productId: string, limit: number = 50): Promise<StockTransaction[]> {
    try {
      const q = query(
        collection(db, 'stockTransactions'),
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockTransaction[];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      return [];
    }
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('trackStock', '==', true),
        where('stockStatus', 'in', ['low_stock', 'out_of_stock'])
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }

  /**
   * Get stock statistics
   */
  async getStockStatistics(): Promise<StockStatistics> {
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('trackStock', '==', true)
      );

      const productsSnapshot = await getDocs(productsQuery);
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      const totalProducts = products.length;
      const totalValue = products.reduce((sum, product) => 
        sum + (product.stockQuantity || 0) * (product.price || 0), 0
      );
      
      const lowStockCount = products.filter(p => p.stockStatus === 'low_stock').length;
      const outOfStockCount = products.filter(p => p.stockStatus === 'out_of_stock').length;
      
      const averageStockLevel = totalProducts > 0 
        ? products.reduce((sum, product) => sum + (product.stockQuantity || 0), 0) / totalProducts
        : 0;

      // Get top selling products (mock data for now - would need sales tracking)
      const topSellingProducts = products
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(product => ({
          id: product.id!,
          name: product.name,
          totalSold: product.views || 0, // Using views as proxy for sales
          currentStock: product.stockQuantity || 0
        }));

      return {
        totalProducts,
        totalValue,
        lowStockCount,
        outOfStockCount,
        averageStockLevel,
        topSellingProducts
      };
    } catch (error) {
      console.error('Error calculating stock statistics:', error);
      return {
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        averageStockLevel: 0,
        topSellingProducts: []
      };
    }
  }

  /**
   * Bulk update stock for multiple products
   */
  async bulkUpdateStock(updates: Array<{
    productId: string;
    quantity: number;
    reason: string;
    type: StockUpdateData['type'];
  }>): Promise<void> {
    const batch = writeBatch(db);

    for (const update of updates) {
      const productRef = doc(db, 'products', update.productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const product = productSnap.data() as Product;
        
        let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
        if (product.trackStock) {
          if (update.quantity === 0) {
            stockStatus = 'out_of_stock';
          } else if (update.quantity <= (product.minStockLevel || 0)) {
            stockStatus = 'low_stock';
          }
        }

        batch.update(productRef, {
          stockQuantity: update.quantity,
          stockStatus,
          updatedAt: new Date()
        });

        // Create transaction record
        await this.createStockTransaction(update.productId, {
          quantity: Math.abs(update.quantity - (product.stockQuantity || 0)),
          reason: update.reason,
          type: update.type
        }, product.stockQuantity || 0, update.quantity);
      }
    }

    await batch.commit();
  }

  /**
   * Export stock data as CSV
   */
  async exportStockData(): Promise<string> {
    try {
      const products = await this.getAllTrackedProducts();
      
      const headers = [
        'Product Name', 'SKU', 'Current Stock', 'Min Level', 'Max Level', 
        'Status', 'Price', 'Total Value', 'Last Updated'
      ];
      
      const rows = products.map(product => [
        product.name,
        product.sku || '',
        product.stockQuantity || 0,
        product.minStockLevel || 0,
        product.maxStockLevel || 0,
        product.stockStatus || 'unknown',
        product.price || 0,
        (product.stockQuantity || 0) * (product.price || 0),
        product.updatedAt ? product.updatedAt.toLocaleDateString() : ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting stock data:', error);
      throw error;
    }
  }

  /**
   * Get all tracked products
   */
  private async getAllTrackedProducts(): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('trackStock', '==', true)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  }
}
