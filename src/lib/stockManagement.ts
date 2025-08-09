import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, StockTransaction } from '@/types/product';

export class StockManagementService {
  // Update stock quantity for a product
  static async updateStock(
    productId: string, 
    newQuantity: number, 
    type: StockTransaction['type'], 
    reason?: string,
    orderId?: string
  ): Promise<boolean> {
    try {
      return await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }
        
        const product = productDoc.data() as Product;
        const previousStock = product.stockQuantity || 0;
        
        // Create stock transaction record
        const stockTransaction: Omit<StockTransaction, 'id'> = {
          productId,
          type,
          quantity: Math.abs(newQuantity - previousStock),
          previousStock,
          newStock: newQuantity,
          reason,
          orderId,
          timestamp: new Date(),
          userId: product.userId
        };
        
        // Add stock transaction
        const transactionRef = collection(db, 'stockTransactions');
        transaction.set(doc(transactionRef), stockTransaction);
        
        // Determine stock status
        const stockStatus = this.determineStockStatus(newQuantity, product.minStockLevel, product.allowBackorders);
        
        // Update product stock
        transaction.update(productRef, {
          stockQuantity: newQuantity,
          stockStatus,
          updatedAt: new Date()
        });
        
        return true;
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      return false;
    }
  }
  
  // Add stock (restock)
  static async addStock(productId: string, quantity: number, reason?: string): Promise<boolean> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) return false;
      
      const product = productDoc.data() as Product;
      const currentStock = product.stockQuantity || 0;
      const newStock = currentStock + quantity;
      
      return await this.updateStock(productId, newStock, 'addition', reason);
    } catch (error) {
      console.error('Error adding stock:', error);
      return false;
    }
  }
  
  // Remove stock (sale, damage, etc.)
  static async removeStock(productId: string, quantity: number, reason?: string, orderId?: string): Promise<boolean> {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) return false;
      
      const product = productDoc.data() as Product;
      const currentStock = product.stockQuantity || 0;
      const newStock = Math.max(0, currentStock - quantity);
      
      const type: StockTransaction['type'] = orderId ? 'sold' : 'subtraction';
      return await this.updateStock(productId, newStock, type, reason, orderId);
    } catch (error) {
      console.error('Error removing stock:', error);
      return false;
    }
  }
  
  // Set exact stock quantity
  static async setStock(productId: string, quantity: number, reason?: string): Promise<boolean> {
    return await this.updateStock(productId, quantity, 'adjustment', reason);
  }
  
  // Get stock history for a product
  static async getStockHistory(productId: string): Promise<StockTransaction[]> {
    try {
      const q = query(
        collection(db, 'stockTransactions'),
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as StockTransaction[];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      return [];
    }
  }
  
  // Get low stock products for a user
  static async getLowStockProducts(userId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('userId', '==', userId),
        where('trackStock', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[];
      
      // Filter for low stock items
      return products.filter(product => {
        const stock = product.stockQuantity || 0;
        const minLevel = product.minStockLevel || 0;
        return stock <= minLevel && stock > 0;
      });
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      return [];
    }
  }
  
  // Get out of stock products for a user
  static async getOutOfStockProducts(userId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('userId', '==', userId),
        where('stockQuantity', '==', 0),
        where('trackStock', '==', true)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Product[];
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      return [];
    }
  }
  
  // Check if product is available for purchase
  static isProductAvailable(product: Product, requestedQuantity: number = 1): boolean {
    if (!product.trackStock) return true; // No stock tracking
    
    const stock = product.stockQuantity || 0;
    
    if (stock >= requestedQuantity) return true;
    if (stock === 0 && product.allowBackorders) return true;
    
    return false;
  }
  
  // Determine stock status based on quantity and settings
  static determineStockStatus(
    quantity: number, 
    minLevel?: number, 
    allowBackorders?: boolean
  ): Product['stockStatus'] {
    if (quantity === 0) {
      return allowBackorders ? 'out_of_stock' : 'out_of_stock';
    }
    
    if (minLevel && quantity <= minLevel) {
      return 'low_stock';
    }
    
    return 'in_stock';
  }
  
  // Get stock statistics for dashboard
  static async getStockStatistics(userId: string): Promise<{
    totalProducts: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalStockValue: number;
    averageStockLevel: number;
  }> {
    try {
      const q = query(
        collection(db, 'products'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const trackedProducts = products.filter(p => p.trackStock);
      
      let inStock = 0;
      let lowStock = 0;
      let outOfStock = 0;
      let totalStockValue = 0;
      let totalStockQuantity = 0;
      
      trackedProducts.forEach(product => {
        const stock = product.stockQuantity || 0;
        const minLevel = product.minStockLevel || 0;
        
        totalStockValue += stock * product.price;
        totalStockQuantity += stock;
        
        if (stock === 0) {
          outOfStock++;
        } else if (stock <= minLevel) {
          lowStock++;
        } else {
          inStock++;
        }
      });
      
      return {
        totalProducts: products.length,
        inStock,
        lowStock,
        outOfStock,
        totalStockValue,
        averageStockLevel: trackedProducts.length > 0 ? totalStockQuantity / trackedProducts.length : 0
      };
    } catch (error) {
      console.error('Error fetching stock statistics:', error);
      return {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalStockValue: 0,
        averageStockLevel: 0
      };
    }
  }
  
  // Bulk update stock for multiple products
  static async bulkUpdateStock(updates: { productId: string; quantity: number; reason?: string }[]): Promise<boolean> {
    try {
      const promises = updates.map(update => 
        this.setStock(update.productId, update.quantity, update.reason)
      );
      
      const results = await Promise.all(promises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error in bulk stock update:', error);
      return false;
    }
  }
  
  // Generate SKU for a product
  static generateSKU(productName: string, category: string, userId: string): string {
    const nameCode = productName.substring(0, 3).toUpperCase();
    const categoryCode = category.substring(0, 2).toUpperCase();
    const userCode = userId.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${nameCode}-${categoryCode}-${userCode}-${timestamp}`;
  }
  
  // Export stock data to CSV format
  static async exportStockData(userId: string): Promise<string> {
    try {
      const products = await this.getAllProductsWithStock(userId);
      
      const headers = [
        'SKU', 'Product Name', 'Category', 'Current Stock', 
        'Min Level', 'Max Level', 'Stock Status', 'Price', 'Stock Value'
      ];
      
      const rows = products.map(product => [
        product.sku || '',
        product.name,
        product.category,
        product.stockQuantity || 0,
        product.minStockLevel || 0,
        product.maxStockLevel || 0,
        product.stockStatus || 'in_stock',
        product.price,
        (product.stockQuantity || 0) * product.price
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting stock data:', error);
      return '';
    }
  }
  
  // Helper method to get all products with stock info
  private static async getAllProductsWithStock(userId: string): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Product[];
  }
}
