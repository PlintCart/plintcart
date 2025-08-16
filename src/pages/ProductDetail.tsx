import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Share2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_visible', true)
        .single();

      if (error) throw error;
      
      if (data) {
        setProduct({
          id: data.id,
          name: data.name,
          description: data.description || '',
          price: Number(data.price),
          imageUrl: data.image_url || '',
          category: data.category,
          isVisible: data.is_visible,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          userId: data.user_id
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive",
      });
      navigate('/storefront');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = () => {
    if (!product) return;
    const message = `Hi! I'd like to order ${product.name} for $${product.price.toFixed(2)}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (!product) return;
    
    const productUrl = window.location.href;
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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground">Product not found</h2>
          <Button onClick={() => navigate('/storefront')} className="mt-4">
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <BackButton
          onClick={() => navigate('/storefront')}
          className="mb-6"
          variant="ghost"
        >
          Back to Store
        </BackButton>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-lg">No image available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <Badge variant="secondary" className="text-sm">
                  {product.category}
                </Badge>
              </div>
              
              <p className="text-4xl font-bold text-primary mb-6">
                ${product.price.toFixed(2)}
              </p>
              
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleOrder} size="lg" className="flex-1">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Pay Now
              </Button>
              <Button onClick={handleShare} variant="outline" size="lg">
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;