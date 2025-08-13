import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, ExternalLink, Package, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MerchantInfo {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  categories: string[];
}

const MerchantDirectory = () => {
  const [merchants, setMerchants] = useState<MerchantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      // Get all visible products to identify active merchants
      const productsQuery = query(collection(db, "products"), where("isVisible", "==", true));
      const productsSnapshot = await getDocs(productsQuery);
      
      const merchantsMap = new Map<string, MerchantInfo>();
      
      productsSnapshot.forEach((doc) => {
        const data = doc.data();
        const merchantId = data.userId;
        
        if (!merchantsMap.has(merchantId)) {
          merchantsMap.set(merchantId, {
            id: merchantId,
            name: `Store ${merchantId.slice(0, 8)}`, // Default name, could be enhanced
            productCount: 0,
            categories: []
          });
        }
        
        const merchant = merchantsMap.get(merchantId)!;
        merchant.productCount++;
        
        if (data.category && !merchant.categories.includes(data.category)) {
          merchant.categories.push(data.category);
        }
      });
      
      setMerchants(Array.from(merchantsMap.values()));
    } catch (error) {
      console.error('Error fetching merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const visitStore = (merchantId: string) => {
    navigate(`/storefront/${merchantId}`);
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
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Store className="h-8 w-8" />
              Merchant Directory
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover stores and shop directly from merchants
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {merchants.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground">No stores available</h2>
            <p className="text-muted-foreground mt-2">Check back later for new merchants!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5" />
              <span className="text-lg font-semibold">{merchants.length} Active Stores</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {merchants.map((merchant) => (
                <Card key={merchant.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {merchant.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Products:</span>
                      <Badge variant="secondary">{merchant.productCount}</Badge>
                    </div>
                    
                    {merchant.categories.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {merchant.categories.slice(0, 3).map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                          {merchant.categories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{merchant.categories.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={() => visitStore(merchant.id)}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Store
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MerchantDirectory;
