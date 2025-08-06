import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";

interface Product {
  id: string;
  name: string;
  price: number;
  isVisible: boolean;
  userId: string;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useSettings();

  // Get currency symbol
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'usd': return '$';
      case 'eur': return '€';
      case 'gbp': return '£';
      case 'ksh': return 'KSh';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(settings.currency);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user's products
      const q = query(collection(db, "products"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const productList: Product[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productList.push({
          id: doc.id,
          name: data.name,
          price: Number(data.price) || 0,
          isVisible: data.isVisible,
          userId: data.userId
        });
      });
      
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = products.length;
  const visibleProducts = products.filter(p => p.isVisible).length;
  const totalRevenue = products.reduce((sum, product) => sum + product.price, 0);
  const averagePrice = totalProducts > 0 ? totalRevenue / totalProducts : 0;

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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}! Here's an overview of your store.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {visibleProducts} visible in store
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visible Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visibleProducts}</div>
              <p className="text-xs text-muted-foreground">
                {totalProducts - visibleProducts} hidden products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{averagePrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Per product average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catalog Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total inventory value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/admin/products/add" 
                className="flex items-center p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Package className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h3 className="font-semibold">Add Product</h3>
                  <p className="text-sm text-muted-foreground">Create a new product</p>
                </div>
              </a>
              
              <a 
                href="/admin/orders" 
                className="flex items-center p-4 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-colors"
              >
                <ShoppingBag className="h-8 w-8 text-secondary mr-3" />
                <div>
                  <h3 className="font-semibold">View Orders</h3>
                  <p className="text-sm text-muted-foreground">Manage customer orders</p>
                </div>
              </a>
              
              <a 
                href="/admin/design" 
                className="flex items-center p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
              >
                <TrendingUp className="h-8 w-8 text-accent mr-3" />
                <div>
                  <h3 className="font-semibold">Customize Store</h3>
                  <p className="text-sm text-muted-foreground">Design your storefront</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}