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
  stockQuantity?: number; // Available stock
  salePrice?: number; // Discounted price if any
  featured?: boolean; // Featured product flag
  views?: number; // Number of times viewed
  likes?: number; // Number of likes/favorites
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
  stockQuantity?: number;
  salePrice?: number;
  featured?: boolean;
}