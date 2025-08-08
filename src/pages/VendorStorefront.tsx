import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Share2, ShoppingCart, MapPin, Phone, Mail, Globe } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { ProductSharingService } from "@/lib/productSharing";

export default function VendorStorefront() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  useEffect(() => {
    if (vendorId) {
      fetchVendorStore();
    }
  }, [vendorId]);

  const fetchVendorStore = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor settings
      console.log('Fetching settings for vendor:', vendorId);
      const settingsDoc = await getDoc(doc(db, 'userSettings', vendorId));
      
      if (settingsDoc.exists()) {
        console.log('Settings found:', settingsDoc.data());
        setBusinessSettings(settingsDoc.data());
      } else {
        console.log('No settings found for vendor:', vendorId);
        // Set default settings if none exist
        setBusinessSettings({
          businessName: 'Online Store',
          theme: 'modern',
          primaryColor: '#10b981'
        });
      }

      // Fetch vendor products (only visible ones)
      console.log('Fetching products for vendor:', vendorId);
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', vendorId),
        where('isVisible', '==', true)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      console.log('Products found:', productsSnapshot.size);
      
      const productsData = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          imageUrl: data.imageUrl || '',
          category: data.category || 'Uncategorized',
          userId: data.userId || '',
          shareableId: data.shareableId || '',
          isVisible: data.isVisible !== false,
          featured: data.featured || false,
          stockQuantity: data.stockQuantity,
          salePrice: data.salePrice,
          tags: data.tags || [],
          specifications: data.specifications || {},
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Product;
      });
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching vendor store:', error);
      toast.error('Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  const shareProduct = async (product: Product) => {
    try {
      const result = await ProductSharingService.shareProductThumbnail(product, businessSettings || {});
      if (result.success) {
        toast.success(result.message || 'Product shared!');
      }
    } catch (error) {
      console.error('Error sharing product:', error);
      toast.error('Failed to share product');
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

  const businessName = businessSettings?.businessName || 'Store';
  const storeTheme = businessSettings?.storeTheme || 'modern';
  const primaryColor = businessSettings?.primaryColor || '#059669';
  const logoUrl = businessSettings?.logoUrl;
  const coverImageUrl = businessSettings?.coverImageUrl;
  const storeDescription = businessSettings?.storeDescription;
  const showBusinessInfo = businessSettings?.showBusinessInfo !== false;
  const currencySymbol = getCurrencySymbol(businessSettings?.currency || 'usd');

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Store link copied!');
            }}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Store Hero Section */}
      <div className="relative">
        {coverImageUrl ? (
          <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${coverImageUrl})` }}>
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl font-bold mb-2">{businessName}</h1>
                {storeDescription && (
                  <p className="text-lg opacity-90">{storeDescription}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <h1 className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
              {businessName}
            </h1>
            {storeDescription && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                {storeDescription}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Business Info */}
      {showBusinessInfo && (
        <div className="border-b bg-background/50 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {businessSettings?.businessAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>{businessSettings.businessAddress}</span>
                </div>
              )}
              {businessSettings?.businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>{businessSettings.businessPhone}</span>
                </div>
              )}
              {businessSettings?.businessEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>{businessSettings.businessEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Products Yet</h2>
            <p className="text-muted-foreground">This store is getting ready. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Our Products</h2>
              <p className="text-muted-foreground">
                {products.length} product{products.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden rounded-t-lg">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        <div 
                          className="text-white px-2 py-1 rounded-full text-sm font-bold shadow-lg"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {currencySymbol}{product.price}
                        </div>
                      </div>

                      {/* Featured Badge */}
                      {product.featured && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{product.category}</Badge>
                        {product.stockQuantity !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => navigate(`/product/${product.shareableId || product.id}`)}
                          style={{ backgroundColor: primaryColor }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => shareProduct(product)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-background/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>
              pl<span className="text-green-600">int</span>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
