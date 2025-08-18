import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Share2, ShoppingCart, MessageCircle, MapPin, Phone, Mail, Globe, Search, Grid, List, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@/types/product";
import { ProductSharingService } from "@/lib/productSharing";
import ProductCard from "@/components/ProductCard";

export default function VendorStorefront() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (vendorId) {
      fetchVendorStore();
    }
  }, [vendorId]);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    if (vendorId) {
      fetchVendorStore();
    }
  }, [vendorId]);

  const fetchVendorStore = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor settings from the correct settings collection
      const settingsDoc = await getDoc(doc(db, 'settings', vendorId));
      
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        setBusinessSettings(settingsData);
        
        // Apply CSS variables for theming
        if (settingsData.primaryColor) {
          document.documentElement.style.setProperty('--primary', settingsData.primaryColor);
        }
      } else {
        // Set default settings if none exist
        setBusinessSettings({
          businessName: 'Online Store',
          storeTheme: 'modern',
          primaryColor: '#059669'
        });
      }

      // Fetch vendor products (only visible ones)
      const productsQuery = query(
        collection(db, 'products'),
        where('userId', '==', vendorId),
        where('isVisible', '==', true)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      
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
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map(p => p.category))].filter(Boolean);
      setCategories(uniqueCategories);
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
            Create your own store
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Products Yet</h2>
            <p className="text-muted-foreground">This store is getting ready. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* Featured Product Display */}
            {(() => {
              const featuredProduct = products.find(p => p.featured) || products[0];
              return (
                <div className="max-w-4xl mx-auto mb-12">
                  <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      {featuredProduct.imageUrl ? (
                        <img
                          src={featuredProduct.imageUrl}
                          alt={featuredProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-24 h-24 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {featuredProduct.featured && (
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="space-y-6">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">{featuredProduct.name}</h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                          {featuredProduct.description}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div 
                            className="text-3xl font-bold text-white px-4 py-2 rounded-lg"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {currencySymbol}{featuredProduct.price}
                          </div>
                          <Badge variant="outline" className="text-lg px-3 py-1">
                            {featuredProduct.category}
                          </Badge>
                        </div>
                        
                        {featuredProduct.stockQuantity !== undefined && (
                          <div className="text-sm text-muted-foreground">
                            {featuredProduct.stockQuantity > 0 
                              ? `${featuredProduct.stockQuantity} in stock` 
                              : 'Out of stock'
                            }
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {/* Primary Action - Pay Now */}
                        <Button 
                          className="w-full h-14 text-lg font-semibold rounded-xl"
                          onClick={() => navigate(`/product/${featuredProduct.shareableId || featuredProduct.id}`)}
                          style={{ backgroundColor: primaryColor }}
                          disabled={featuredProduct.stockQuantity === 0}
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {featuredProduct.stockQuantity === 0 ? 'Out of Stock' : 'Pay Now'}
                        </Button>
                        
                        {/* Contact Vendor Button */}
                        <Button 
                          variant="outline" 
                          className="w-full h-12 text-base font-medium border-2"
                          style={{ 
                            borderColor: primaryColor, 
                            color: primaryColor 
                          }}
                          onClick={() => {
                            if (businessSettings?.whatsappNumber || businessSettings?.businessPhone) {
                              const phoneNumber = businessSettings.whatsappNumber || businessSettings.businessPhone;
                              const message = `Hi! I'm interested in ${featuredProduct.name} from your store.`;
                              const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, '_blank');
                            }
                          }}
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Contact vendor
                        </Button>

                        {/* Secondary Actions Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button 
                            variant="outline" 
                            className="h-11 text-sm"
                            onClick={() => shareProduct(featuredProduct)}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                          <Button 
                            variant="outline" 
                            className="h-11 text-sm"
                            onClick={() => navigate(`/product/${featuredProduct.shareableId || featuredProduct.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {/* View All Products Section */}
            {products.length > 1 && (
              <div className="text-center">
                <div className="border-t pt-8">
                  <h3 className="text-xl font-bold mb-4">More Products Available</h3>
                  <p className="text-muted-foreground mb-6">
                    We have {products.length - 1} more product{products.length - 1 !== 1 ? 's' : ''} in our store
                  </p>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      // Scroll to show all products in grid
                      const element = document.getElementById('all-products');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    View All Products
                  </Button>
                </div>
              </div>
            )}
            
            {/* All Products Grid (Hidden by default, shown when "View All" is clicked) */}
            <div id="all-products" className="mt-16 pt-8 border-t">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">All Products</h2>
                <p className="text-muted-foreground">
                  Browse our complete collection
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
                      
                      <div className="p-6">
                        {/* Header Info */}
                        <div className="space-y-4 mb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
                              <Badge variant="outline" className="mt-2">{product.category}</Badge>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                        </div>

                        {/* Stock Status */}
                        {product.stockQuantity !== undefined && (
                          <div className="mb-6">
                            <Badge 
                              variant={product.stockQuantity > 0 ? "default" : "destructive"}
                              className="shadow-lg"
                              style={{ backgroundColor: product.stockQuantity > 0 ? primaryColor : undefined }}
                            >
                              {product.stockQuantity > 0 
                                ? `${product.stockQuantity} in stock` 
                                : 'Out of stock'
                              }
                            </Badge>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          {/* Primary Order Button */}
                          <Button 
                            className="w-full h-14 text-lg font-semibold" 
                            size="lg"
                            onClick={() => navigate(`/product/${product.shareableId || product.id}`)}
                            disabled={product.stockQuantity === 0}
                            style={{ backgroundColor: primaryColor }}
                          >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            {product.stockQuantity === 0 ? 'Out of Stock' : 'Pay Now'}
                          </Button>
                          
                          {/* Contact Vendor Button */}
                          <Button 
                            variant="outline"
                            className="w-full h-12 text-base font-medium border-2" 
                            onClick={() => shareProduct(product)}
                            disabled={product.stockQuantity === 0}
                            style={{ borderColor: primaryColor, color: primaryColor }}
                          >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Contact vendor
                          </Button>
                          
                          {/* Secondary Actions */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                              variant="outline" 
                              className="h-11 text-sm" 
                              onClick={() => shareProduct(product)}
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-11 text-sm" 
                              onClick={() => navigate(`/product/${product.shareableId || product.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>

                        {/* Business Info Footer */}
                        <div className="border-t mt-6 pt-6 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="w-4 h-4" />
                              <span>Sold by <span className="font-semibold text-foreground">{businessName}</span></span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Powered by <span className="font-semibold" style={{ color: primaryColor }}>pl<span className="text-green-600">int</span></span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
