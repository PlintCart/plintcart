import { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Grid, List, Share2, Search, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductSharingService } from "@/lib/productSharing";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";

interface MerchantSettings {
  storeTheme?: string;
  primaryColor?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  storeDescription?: string;
  showBusinessInfo?: boolean;
  showSocialProof?: boolean;
  showCategories?: boolean;
  showSearch?: boolean;
  storeName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
}

const Storefront = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [storeInfo, setStoreInfo] = useState<{ name: string; description?: string } | null>(null);
  const [merchantSettings, setMerchantSettings] = useState<MerchantSettings>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const { merchantId } = useParams();

  // Get merchant ID from URL parameter - this is required for public storefront
  const targetMerchantId = merchantId;

  useEffect(() => {
    if (targetMerchantId) {
      fetchProducts();
      fetchStoreInfo();
      fetchMerchantSettings();
    } else {
      // Redirect to index page if no merchant ID provided
      window.location.href = '/';
    }
  }, [targetMerchantId]);

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

  const fetchMerchantSettings = async () => {
    if (!targetMerchantId) return;

    try {
      const settingsRef = doc(db, "settings", targetMerchantId);
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        setMerchantSettings(settingsData as MerchantSettings);
        
        // Apply CSS variables for theming
        if (settingsData.primaryColor) {
          document.documentElement.style.setProperty('--primary', settingsData.primaryColor);
        }
      }
    } catch (error) {
      console.error('Error fetching merchant settings:', error);
    }
  };

  const fetchProducts = async () => {
    if (!targetMerchantId) return;
    
    try {
      const q = query(
        collection(db, "products"), 
        where("isVisible", "==", true),
        where("userId", "==", targetMerchantId)
      );
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
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productList.map(p => p.category))].filter(Boolean);
      setCategories(uniqueCategories);
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

  const fetchStoreInfo = async () => {
    if (!targetMerchantId) return;
    
    try {
      // Get store info from user settings and profile
      const userDoc = await getDoc(doc(db, "users", targetMerchantId));
      const settingsDoc = await getDoc(doc(db, "settings", targetMerchantId));
      
      let storeName = "Store";
      let storeDescription = "";
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        storeName = userData.storeName || userData.displayName || "Store";
        storeDescription = userData.storeDescription || "";
      }
      
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        // Settings override user data
        storeName = settingsData.storeName || storeName;
        storeDescription = settingsData.storeDescription || storeDescription;
      }
      
      setStoreInfo({
        name: storeName,
        description: storeDescription
      });
    } catch (error) {
      console.error('Error fetching store info:', error);
      setStoreInfo({ name: "Store" });
    }
  };

  const shareProduct = async (product: Product) => {
    try {
      // For public storefront, use minimal settings or defaults
      let userSettings = {};
      
      // Try to get settings but don't fail if not accessible
      try {
        const settingsDoc = await getDoc(doc(db, "settings", product.userId));
        userSettings = settingsDoc.exists() ? settingsDoc.data() : {};
      } catch (settingsError) {
        console.warn('Could not load settings, using defaults:', settingsError);
        // Continue with empty settings - this is normal for public access
      }
      
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
    <div className="min-h-screen bg-background" style={{ 
      '--primary': merchantSettings.primaryColor || '#059669',
      '--primary-rgb': merchantSettings.primaryColor ? 
        merchantSettings.primaryColor.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16)).join(', ') 
        : '5, 150, 105'
    } as React.CSSProperties}>
      
      {/* Hero Section */}
      {merchantSettings.coverImageUrl && (
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary/10 to-primary/5 overflow-hidden">
          <img 
            src={merchantSettings.coverImageUrl} 
            alt="Store banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto">
              <div className="flex items-end gap-4">
                {merchantSettings.logoUrl && (
                  <img 
                    src={merchantSettings.logoUrl} 
                    alt="Store logo"
                    className="w-16 h-16 md:w-20 md:h-20 object-contain bg-background rounded-lg p-2 shadow-lg"
                  />
                )}
                <div className="text-white">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{storeInfo?.name || "Store"}</h1>
                  {storeInfo?.description && (
                    <p className="text-lg opacity-90 max-w-2xl">{storeInfo.description}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          {!merchantSettings.coverImageUrl && (
            <div className="flex items-center gap-4 mb-4">
              {merchantSettings.logoUrl && (
                <img 
                  src={merchantSettings.logoUrl} 
                  alt="Store logo"
                  className="w-12 h-12 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{storeInfo?.name || "Store"}</h1>
                {storeInfo?.description && (
                  <p className="text-sm text-muted-foreground">{storeInfo.description}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex-1 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-3">
                {(merchantSettings.showSearch !== false) && (
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}
                
                {(merchantSettings.showCategories !== false) && categories.length > 0 && (
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm min-w-32"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            
            {/* View Mode Toggle */}
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
        </div>
      </header>

      {/* Products Section */}
      <main className="container mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              {searchTerm || selectedCategory !== "all" ? "No products found" : "No products available"}
            </h2>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" 
                ? "Try adjusting your search or filters" 
                : "Check back later for new items!"
              }
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory !== "all" && ` in ${selectedCategory}`}
              </p>
            </div>
            
            {/* Products Grid */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  onShare={() => shareProduct(product)}
                  showShareButton
                  showPaymentButton
                  showOrderButton
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Business Info Footer */}
      {merchantSettings.showBusinessInfo && (
        <footer className="bg-muted/30 border-t mt-12">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">{storeInfo?.name || "Store"}</h3>
              {merchantSettings.businessPhone && (
                <p className="text-sm text-muted-foreground">
                  📞 {merchantSettings.businessPhone}
                </p>
              )}
              {merchantSettings.businessEmail && (
                <p className="text-sm text-muted-foreground">
                  ✉️ {merchantSettings.businessEmail}
                </p>
              )}
              {merchantSettings.businessAddress && (
                <p className="text-sm text-muted-foreground">
                  📍 {merchantSettings.businessAddress}
                </p>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Storefront;