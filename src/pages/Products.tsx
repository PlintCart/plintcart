import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { ProductSharingService } from "@/lib/productSharing";
import { ThumbnailPreview } from "@/components/ThumbnailPreview";
import { StoreSetupReminder } from "@/components/StoreSetupReminder";

interface Product {
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
  shareableId?: string;
  businessName?: string;
  whatsappNumber?: string;
  tags?: string[];
  specifications?: Record<string, string>;
  stockQuantity?: number;
  salePrice?: number;
  featured?: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, "products"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const productList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productList.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          price: Number(data.price),
          imageUrl: data.imageUrl || '',
          category: data.category,
          isVisible: data.isVisible,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          userId: data.userId
        });
      });
      
      setProducts(productList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (productId: string, currentVisibility: boolean) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        isVisible: !currentVisibility,
        updatedAt: new Date()
      });
      
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, isVisible: !currentVisibility }
          : product
      ));
      
      toast.success(`Product ${!currentVisibility ? 'shown' : 'hidden'} successfully`);
    } catch (error) {
      console.error('Error updating product visibility:', error);
      toast.error('Failed to update product visibility');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(products.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleShareProduct = async (product: Product) => {
    try {
      // Try the simple sharing method first (most reliable)
      const result = await ProductSharingService.shareProductSimple(product, settings);
      
      if (result.success) {
        toast.success(result.message || 'Product shared with thumbnail and store links!');
      } else {
        // Fallback to enhanced sharing method
        const fallbackResult = await ProductSharingService.shareProductWithMessage(product, settings);
        if (fallbackResult.success) {
          toast.success(fallbackResult.message || 'Product shared!');
        } else {
          // Final fallback to WhatsApp with text
          const whatsappLink = ProductSharingService.generateWhatsAppImageShare(product, settings);
          window.open(whatsappLink, '_blank');
          
          const shareableLink = ProductSharingService.generateShareableLink(product);
          await navigator.clipboard.writeText(shareableLink);
          
          toast.success('WhatsApp opened! Link copied to clipboard');
        }
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      
      // Final fallback - just copy the link
      try {
        const shareableLink = ProductSharingService.generateShareableLink(product);
        await navigator.clipboard.writeText(shareableLink);
        toast.success('Product link copied to clipboard');
      } catch (clipboardError) {
        toast.error('Failed to share product');
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <Button onClick={() => navigate('/admin/products/add')} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Store Setup Reminder */}
        <StoreSetupReminder />

        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">No products yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Start building your catalog by adding your first product. Each product automatically appears in your custom storefront!
                </p>
                <Button onClick={() => navigate('/admin/products/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={product.isVisible ? "default" : "secondary"}>
                      {product.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold line-clamp-1 text-sm sm:text-base">{product.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base sm:text-lg">${product.price.toFixed(2)}</span>
                      <Badge variant="outline" className="text-xs">{product.category}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1 sm:flex sm:gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleVisibility(product.id, product.isVisible)}
                      title={product.isVisible ? "Hide product" : "Show product"}
                      className="p-1.5 sm:p-2"
                    >
                      {product.isVisible ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </Button>
                    <ThumbnailPreview product={product} settings={settings} />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShareProduct(product)}
                      title="Share on WhatsApp"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 sm:p-2"
                    >
                      <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button variant="outline" size="sm" title="Edit product" className="p-1.5 sm:p-2">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      title="Delete product"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 sm:p-2"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
