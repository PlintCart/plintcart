import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  BarChart3,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { Product, StockTransaction } from '@/types/product';
import { StockManagementService } from '@/services/StockManagementService';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getCurrencySymbol } from '@/lib/utils';

interface StockManagementProps {
  products: Product[];
  onProductUpdate: () => void;
}

export default function StockManagement({ products, onProductUpdate }: StockManagementProps) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockHistory, setStockHistory] = useState<StockTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Stock adjustment form
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchStockData();
    }
  }, [user]);

  const fetchStockData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const stockService = new StockManagementService();
      const [stats, lowStock] = await Promise.all([
        stockService.getStockStatistics(),
        stockService.getLowStockProducts(),
      ]);

      setStatistics(stats);
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity) {
      toast.error('Please select a product and enter quantity');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const stockService = new StockManagementService();
      const reason = adjustmentReason || `Manual ${adjustmentType} adjustment`;
      const quantity = parseInt(adjustmentQuantity);

      switch (adjustmentType) {
        case 'add':
          await stockService.addStock(selectedProduct.id, quantity, reason, 'addition');
          break;
        case 'remove':
          await stockService.removeStock(selectedProduct.id, quantity, reason, 'subtraction');
          break;
        case 'set':
          await stockService.updateStock(selectedProduct.id, quantity, reason, 'adjustment');
          break;
      }

      toast.success('Stock updated successfully');
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      onProductUpdate();
      fetchStockData();
      if (selectedProduct) {
        fetchStockHistory(selectedProduct.id);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async (productId: string) => {
    try {
      const stockService = new StockManagementService();
      const history = await stockService.getStockHistory(productId);
      setStockHistory(history);
    } catch (error) {
      console.error('Error fetching stock history:', error);
    }
  };

  const exportStockData = async () => {
    if (!user) return;

    try {
      const stockService = new StockManagementService();
      const csvData = await stockService.exportStockData();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Stock report exported successfully');
    } catch (error) {
      console.error('Error exporting stock data:', error);
      toast.error('Failed to export stock data');
    }
  };

  const getStockStatusBadge = (product: Product) => {
    const stock = product.stockQuantity || 0;
    const minLevel = product.minStockLevel || 0;

    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stock <= minLevel) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    
    const stock = product.stockQuantity || 0;
    const minLevel = product.minStockLevel || 0;
    
    switch (statusFilter) {
      case 'in_stock':
        return stock > minLevel;
      case 'low_stock':
        return stock <= minLevel && stock > 0;
      case 'out_of_stock':
        return stock === 0;
      default:
        return true;
    }
  });

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{statistics.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">In Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{statistics.inStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{statistics.lowStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">{statistics.outOfStock}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="adjust" className="text-xs sm:text-sm">Adjust Stock</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
          </TabsList>
          
          <Button onClick={exportStockData} variant="outline" className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products List */}
          <div className="grid gap-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground break-words">
                            SKU: {product.sku || 'N/A'} • {product.category}
                          </p>
                          <p className="text-sm">
                            Stock: {product.stockQuantity || 0} 
                            {product.minStockLevel && ` (Min: ${product.minStockLevel})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:space-y-2">
                        {getStockStatusBadge(product)}
                        <div className="text-sm font-medium">
                          {getCurrencySymbol(settings.currency)}{product.price}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No products found matching your criteria'
                      : 'No products available'
                    }
                  </p>
                  {(searchTerm || statusFilter !== 'all') && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="mt-2"
                    >
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="adjust" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adjust Stock Levels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Product</Label>
                  <Select 
                    value={selectedProduct?.id || ''} 
                    onValueChange={(value) => {
                      const product = products.find(p => p.id === value);
                      setSelectedProduct(product || null);
                      if (product) {
                        fetchStockHistory(product.id);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <span className="truncate">
                            {product.name} (Current: {product.stockQuantity || 0})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add Stock</SelectItem>
                      <SelectItem value="remove">Remove Stock</SelectItem>
                      <SelectItem value="set">Set Exact Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Input
                    placeholder="Reason for adjustment"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <Button 
                onClick={handleStockAdjustment} 
                disabled={!selectedProduct || !adjustmentQuantity}
                className="w-full"
              >
                {adjustmentType === 'add' && <Plus className="w-4 h-4 mr-2" />}
                {adjustmentType === 'remove' && <Minus className="w-4 h-4 mr-2" />}
                {adjustmentType === 'set' && <BarChart3 className="w-4 h-4 mr-2" />}
                {adjustmentType === 'add' ? 'Add Stock' : 
                 adjustmentType === 'remove' ? 'Remove Stock' : 'Set Stock'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {selectedProduct ? (
            <Card>
              <CardHeader>
                <CardTitle>Stock History - {selectedProduct.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stockHistory.map((transaction) => (
                    <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground break-words">
                          {transaction.reason || 'No reason provided'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.timestamp.toLocaleDateString()} {transaction.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:text-right">
                        <p className="font-medium whitespace-nowrap">
                          {transaction.previousStock} → {transaction.newStock}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.type === 'addition' ? '+' : transaction.type === 'subtraction' ? '-' : ''}
                          {transaction.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  {stockHistory.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No stock history available for this product
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Select a product from the "Adjust Stock" tab to view its history
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
