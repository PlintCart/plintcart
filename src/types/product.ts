export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // Enhanced sharing features
  shareableId?: string; // Unique ID for public sharing
  businessName?: string; // Name of the business selling this
  whatsappNumber?: string; // Contact number for orders
  tags?: string[]; // Search tags
  specifications?: { [key: string]: string }; // Product specs
  salePrice?: number; // Discounted price if any
  featured?: boolean; // Featured product flag
  views?: number; // Number of times viewed
  likes?: number; // Number of likes/favorites
  
  // Comprehensive Stock Management
  stockQuantity?: number; // Current available stock
  initialStock?: number; // Initial stock when product was created
  minStockLevel?: number; // Minimum stock level (low stock warning)
  maxStockLevel?: number; // Maximum stock capacity
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  allowBackorders?: boolean; // Allow orders when out of stock
  trackStock?: boolean; // Whether to track stock for this product
  sku?: string; // Stock Keeping Unit identifier
  barcode?: string; // Product barcode
  restockDate?: Date; // Expected restock date if out of stock
  stockHistory?: StockTransaction[]; // History of stock changes
}

export interface StockTransaction {
  id: string;
  productId: string;
  type: 'addition' | 'subtraction' | 'adjustment' | 'sold' | 'returned' | 'damaged';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  orderId?: string; // If related to an order
  timestamp: Date;
  userId: string; // Who made the change
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  isVisible: boolean;
  image?: File;
  
  // Enhanced form fields
  tags?: string;
  specifications?: string; // JSON string of key-value pairs
  salePrice?: number;
  featured?: boolean;
  
  // Stock Management Fields
  stockQuantity?: number;
  initialStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  allowBackorders?: boolean;
  trackStock?: boolean;
  sku?: string;
  barcode?: string;
  restockDate?: string; // String for form input
}