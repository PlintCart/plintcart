import { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Grid, List, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSharingService } from "@/lib/productSharing";

const Storefront = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "products"), where("isVisible", "==", true));
      const querySnapshot = await getDocs(q);
      const productList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productList.push({
          id: doc.id,
          name: data.name,
          description: data.description || '',
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
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const shareProduct = async (product: Product) => {
    try {
      // Get settings for thumbnail generation
      const settingsDoc = await getDoc(doc(db, "settings", product.userId));
      const userSettings = settingsDoc.exists() ? settingsDoc.data() : {};
      
      // Use thumbnail sharing
      const result = await ProductSharingService.shareProductThumbnail(product, userSettings);
      
      if (result.success) {
        if (result.message) {
          console.log(result.message);
        }
      } else {
        // Fallback to regular sharing
        const productUrl = `${window.location.origin}/product/${product.id}`;
        const message = `Check out ${product.name} for $${product.price.toFixed(2)}! ${productUrl}`;
        
        if (navigator.share) {
          await navigator.share({
            title: product.name,
            text: message,
            url: productUrl,
          });
        } else {
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      // Simple fallback
      const productUrl = `${window.location.origin}/product/${product.id}`;
      const message = `Check out ${product.name} for $${product.price.toFixed(2)}! ${productUrl}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Our Store</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-muted-foreground">No products available</h2>
            <p className="text-muted-foreground mt-2">Check back later for new items!</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onShare={() => shareProduct(product)}
                showShareButton
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Storefront;