import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Grid, List, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProducts(data?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: Number(item.price),
        imageUrl: item.image_url || '',
        category: item.category,
        isVisible: item.is_visible,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        userId: item.user_id
      })) || []);
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
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const message = `Check out ${product.name} for $${product.price.toFixed(2)}! ${productUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: message,
          url: productUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
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