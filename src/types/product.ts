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
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  isVisible: boolean;
  image?: File;
}