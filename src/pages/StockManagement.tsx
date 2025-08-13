import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  BarChart3,
  Search,
  RefreshCw,
  Star,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { StockManagementService } from '@/services/StockManagementService';
import { SalesAnalyticsService, ProductSalesAnalytics } from '@/services/SalesAnalyticsService';
import { Product } from '@/types/product';

export default function StockManagement() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [mostFrequentProducts, setMostFrequentProducts] = useState<ProductSalesAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Firebase-friendly: Load products with simple query (avoid composite index requirement)
  const loadProducts = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      // Simplified query - only filter by userId to avoid composite index requirement
      const q = query(
        productsRef,
        where('userId', '==', auth.currentUser.uid),
        limit(50) // Free tier friendly - limit results
      );
      
      const snapshot = await getDocs(q);
      const loadedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Filter for stock tracking in memory (free tier friendly - no additional Firebase reads)
      const stockTrackedProducts = loadedProducts.filter(p => p.trackStock === true);
      setProducts(stockTrackedProducts);
      
      // Filter for alerts (free tier friendly - filter in memory vs complex queries)
      const lowStock = stockTrackedProducts.filter(p => 
        p.stockQuantity <= (p.minStockLevel || 5) && p.stockQuantity > 0
      );
      const outOfStock = stockTrackedProducts.filter(p => p.stockQuantity === 0);
      
      setLowStockProducts(lowStock);
      setOutOfStockProducts(outOfStock);
      
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load sales analytics
  const loadSalesAnalytics = async () => {
    if (!auth.currentUser) return;
    
    try {
      const analytics = await SalesAnalyticsService.getMostFrequentlyBoughtProducts(
        auth.currentUser.uid, 
        10
      );
      setMostFrequentProducts(analytics);
    } catch (error) {
      console.error('Error loading sales analytics:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSalesAnalytics();
  }, []);

  // Filter products based on search (client-side to save Firebase reads)
  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name)); // Client-side sorting to avoid index requirement

  // Stock adjustment functions
  const handleStockAdjustment = async (productId: string, type: 'add' | 'remove') => {
    if (!adjustmentQuantity || adjustmentQuantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      const stockService = new StockManagementService();
      
      if (type === 'add') {
        await stockService.addStock(productId, adjustmentQuantity, adjustmentReason || 'Stock addition');
      } else {
        await stockService.removeStock(productId, adjustmentQuantity, adjustmentReason || 'Stock removal');
      }
      
      toast.success(`Stock ${type === 'add' ? 'added' : 'removed'} successfully`);
      setSelectedProduct(null);
      setAdjustmentQuantity(0);
      setAdjustmentReason('');
      loadProducts(); // Refresh data
      loadSalesAnalytics(); // Refresh analytics
      
    } catch (error) {
      console.error('Stock adjustment error:', error);
      toast.error(`Failed to ${type} stock`);
    } finally {
      setLoading(false);
    }
  };

  const getStockBadgeVariant = (product: Product) => {
    if (product.stockQuantity === 0) return 'destructive';
    if (product.stockQuantity <= (product.minStockLevel || 5)) return 'secondary';
    return 'default';
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) return 'Out of Stock';
    if (product.stockQuantity <= (product.minStockLevel || 5)) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Stock Management</h1>
            <p className="text-muted-foreground">Monitor and manage your inventory</p>
          </div>
          <Button 
            onClick={() => {
              loadProducts();
              loadSalesAnalytics();
            }} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Management Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="analytics">Top Selling</TabsTrigger>
            <TabsTrigger value="low-stock" className="relative">
              Low Stock
              {lowStockProducts.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {lowStockProducts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="out-of-stock" className="relative">
              Out of Stock
              {outOfStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {outOfStockProducts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* All Products Tab */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Products ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku || 'N/A'} | Price: ${product.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Stock</p>
                          <p className="font-bold">{product.stockQuantity || 0}</p>
                        </div>
                        <Badge variant={getStockBadgeVariant(product)}>
                          {getStockStatus(product)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProduct(product)}
                        >
                          Adjust
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && products.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No products found matching your search
                    </div>
                  )}
                  {products.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No Stock-Tracked Products</p>
                      <p className="mb-4">Add products with stock tracking enabled to manage inventory here.</p>
                      <Button onClick={() => window.location.href = '/admin/products/add'}>
                        Add Product
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Most Frequently Bought Items
                </CardTitle>
                <p className="text-muted-foreground">
                  Identify your best-selling products to make informed investment decisions
                </p>
              </CardHeader>
              <CardContent>
                {mostFrequentProducts.length > 0 ? (
                  <div className="space-y-4">
                    {mostFrequentProducts.map((product, index) => (
                      <div 
                        key={product.productId} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          {index < 3 && (
                            <Star className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <h3 className="font-medium">{product.productName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Category: {product.category} | Price: ${product.price.toFixed(2)}
                            </p>
                            {product.lastSaleDate && (
                              <p className="text-xs text-muted-foreground">
                                Last sold: {product.lastSaleDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-right">
                          <div>
                            <div className="flex items-center text-sm">
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              <span className="font-semibold">{product.totalSales}</span>
                              <span className="text-muted-foreground ml-1">orders</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {product.totalQuantitySold} units sold
                            </p>
                          </div>
                          
                          <div>
                            <div className="flex items-center text-sm">
                              <DollarSign className="w-4 h-4 mr-1" />
                              <span className="font-semibold text-green-600">
                                ${product.totalRevenue.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Avg: ${product.averageOrderValue.toFixed(2)}
                            </p>
                          </div>
                          
                          <Badge variant={index < 3 ? "default" : "secondary"} className="flex items-center gap-1">
                            {index < 3 ? <TrendingUp className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
                            Top {index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">💡 Investment Insights</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• <strong>Top 3 products</strong> generate the most revenue - consider increasing stock levels</p>
                        <p>• <strong>High-frequency items</strong> have proven market demand - prioritize these for marketing</p>
                        <p>• <strong>Recent sales data</strong> helps predict future inventory needs</p>
                        {mostFrequentProducts.length > 0 && (
                          <p>• Your top seller generates <strong>${mostFrequentProducts[0]?.totalRevenue.toFixed(2)}</strong> in revenue</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Sales Data Yet</p>
                    <p className="mb-4">Start tracking stock transactions to see analytics here.</p>
                    <p className="text-sm">Sales data is based on stock transactions marked as "sold".</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Stock Tab */}
          <TabsContent value="low-stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Low Stock Alerts ({lowStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                      <div className="flex items-center space-x-4">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Current: {product.stockQuantity} | Min Level: {product.minStockLevel || 5}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Restock
                      </Button>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No low stock products
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Out of Stock Tab */}
          <TabsContent value="out-of-stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                  Out of Stock ({outOfStockProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {outOfStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-4">
                        {product.imageUrl && (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            SKU: {product.sku || 'N/A'} | Price: ${product.price}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Stock
                      </Button>
                    </div>
                  ))}
                  {outOfStockProducts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No out of stock products
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stock Adjustment Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Adjust Stock - {selectedProduct.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Current Stock: {selectedProduct.stockQuantity}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Reason (Optional)</label>
                  <Input
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g., Received new shipment"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleStockAdjustment(selectedProduct.id!, 'add')}
                    disabled={loading || !adjustmentQuantity}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStockAdjustment(selectedProduct.id!, 'remove')}
                    disabled={loading || !adjustmentQuantity}
                    className="flex-1"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedProduct(null);
                    setAdjustmentQuantity(0);
                    setAdjustmentReason('');
                  }}
                  className="w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}