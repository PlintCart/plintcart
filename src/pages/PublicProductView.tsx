import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Share2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  imageUrl: string;
  category: string;
  businessName?: string;
  whatsappNumber?: string;
  tags?: string[];
  specifications?: Record<string, string>;
  stockQuantity?: number;
  featured?: boolean;
  userId: string;
}

export default function PublicProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    // Set document meta tags for better sharing
    if (product) {
      document.title = `${product.name} - ${product.businessName || 'Plint Store'}`;
      
      // Update Open Graph meta tags
      updateMetaTag('og:title', product.name);
      updateMetaTag('og:description', product.description);
      updateMetaTag('og:image', product.imageUrl);
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:type', 'product');
      
      // Twitter Card meta tags
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', product.name);
      updateMetaTag('twitter:description', product.description);
      updateMetaTag('twitter:image', product.imageUrl);
    }
  }, [product]);

  const updateMetaTag = (property: string, content: string) => {
    let element = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        element.setAttribute('property', property);
      } else {
        element.setAttribute('name', property);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  const fetchProduct = async () => {
    try {
      // First try to find by shareableId in all products
      const productsCollection = collection(db, "products");
      const shareableIdQuery = query(productsCollection, where("shareableId", "==", id));
      let querySnapshot = await getDocs(shareableIdQuery);
      
      let productData = null;
      
      if (!querySnapshot.empty) {
        // Found by shareableId
        const doc = querySnapshot.docs[0];
        productData = { id: doc.id, ...doc.data() } as Product;
      } else {
        // Fallback: try to find by document ID
        const productDoc = await getDoc(doc(db, "products", id!));
        if (productDoc.exists()) {
          productData = { id: productDoc.id, ...productDoc.data() } as Product;
        }
      }
      
      if (productData) {
        setProduct(productData);
        
        // Fetch business settings
        const settingsDoc = await getDoc(doc(db, "settings", productData.userId));
        if (settingsDoc.exists()) {
          setBusinessSettings(settingsDoc.data());
        }
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = () => {
    if (!product) return;
    
    const whatsappNumber = businessSettings?.whatsappNumber || product.whatsappNumber;
    const businessName = businessSettings?.businessName || product.businessName || 'Store';
    const currencySymbol = getCurrencySymbol(businessSettings?.currency || 'usd');
    
    const message = `Hi! I'd like to order:\n\n` +
      `🛍️ *${product.name}*\n` +
      `💰 Price: ${currencySymbol}${product.price}\n\n` +
      `Please confirm availability and delivery details.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleShare = async () => {
    if (!product) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} - ${getCurrencySymbol(businessSettings?.currency || 'usd')}${product.price}`,
          url: window.location.href
        });
      } catch (error) {
        // Fallback to copy link
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'usd': return '$';
      case 'eur': return '€';
      case 'gbp': return '£';
      case 'ksh': return 'KSh';
      default: return '$';
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
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(businessSettings?.currency || 'usd');
  const businessName = businessSettings?.businessName || product.businessName || 'Store';
  const storeTheme = businessSettings?.storeTheme || 'modern';
  const primaryColor = businessSettings?.primaryColor || '#059669';
  const logoUrl = businessSettings?.logoUrl;
  const showBusinessInfo = businessSettings?.showBusinessInfo !== false;

  // Theme-based styling
  const getThemeClasses = () => {
    switch (storeTheme) {
      case 'elegant':
        return 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
      case 'vibrant':
        return 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50';
      case 'classic':
        return 'bg-gradient-to-br from-gray-50 via-white to-blue-50';
      default: // modern
        return 'bg-gradient-to-br from-background via-accent/10 to-background';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClasses()}`}>
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 mx-auto mb-1" />
            ) : (
              <h1 className="text-lg font-bold" style={{ color: primaryColor }}>
                pl<span className="text-green-600">int</span>
              </h1>
            )}
            <p className="text-xs text-muted-foreground">{businessName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Product Details - Thumbnail Style */}
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Card className="overflow-hidden shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Product Image - Large Thumbnail */}
            <div className="relative aspect-square w-full overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-2" />
                    <span className="text-muted-foreground">Product Image</span>
                  </div>
                </div>
              )}
              
              {/* Floating Price Badge */}
              <div className="absolute top-4 right-4">
                <div 
                  className="text-white px-3 py-1 rounded-full font-bold shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {currencySymbol}{product.price}
                </div>
                {product.salePrice && product.salePrice < product.price && (
                  <div className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full text-xs mt-1 line-through">
                    {currencySymbol}{product.salePrice}
                  </div>
                )}
              </div>

              {/* Featured Badge */}
              {product.featured && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-yellow-500 text-white shadow-lg">
                    ⭐ Featured
                  </Badge>
                </div>
              )}

              {/* Stock Status */}
              {product.stockQuantity !== undefined && (
                <div className="absolute bottom-4 left-4">
                  <Badge 
                    variant={product.stockQuantity > 0 ? "default" : "destructive"}
                    className="shadow-lg"
                  >
                    {product.stockQuantity > 0 
                      ? `${product.stockQuantity} in stock` 
                      : 'Out of stock'
                    }
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Info - Compact */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold">{product.name}</h1>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
              </div>

              {/* Quick Specs */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Quick Info</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="ml-1 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Buttons - Prominent */}
              <div className="space-y-3 pt-2">
                <Button 
                  className="w-full h-12 text-lg font-semibold text-white hover:opacity-90" 
                  size="lg"
                  onClick={handleOrderNow}
                  disabled={product.stockQuantity === 0}
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Order via WhatsApp
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/storefront')}>
                    View Store
                  </Button>
                </div>
              </div>

              {/* Business Info */}
              {showBusinessInfo && (
                <div className="border-t pt-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Sold by <span className="font-semibold text-foreground">{businessName}</span></span>
                  </div>
                  {businessSettings?.storeDescription && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {businessSettings.storeDescription}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Powered by <span className="font-semibold" style={{ color: primaryColor }}>pl<span className="text-green-600">int</span></span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
