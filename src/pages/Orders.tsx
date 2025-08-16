import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ShoppingBag, 
  User, 
  Phone, 
  CreditCard,
  Search,
  RefreshCw,
  DollarSign,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Eye,
  MessageCircle,
  CheckSquare,
  Smartphone,
  Truck
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { getCurrencySymbol } from "@/lib/utils";
import { toast } from "sonner";
import { PaymentInfo } from "@/types/payment";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'confirmed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'cod_pending' | 'pending_confirmation' | 'failed';
  paymentMethod?: 'mpesa' | 'cash' | 'swypt';
  paymentReference?: string;
  paymentInstructions?: string;
  paymentConfirmedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  productName?: string;
  productPrice?: number;
  message?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Computed order statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const completedOrders = orders.filter(order => 
    order.status === 'completed' || order.status === 'confirmed'
  );
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');
  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = order.createdAt;
    return orderDate.toDateString() === today.toDateString();
  });
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Simplified query without orderBy to avoid index requirement
      const ordersQuery = query(
        collection(db, "orders"),
        where("businessOwnerId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      const ordersList: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ordersList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order);
      });

      // Sort in memory instead of in the query
      ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // If no orders found, create some sample data to show the interface
      if (ordersList.length === 0) {
        const sampleOrders: Order[] = [
          {
            id: "sample-001",
            customerName: "Sample Customer",
            customerPhone: "+1234567890",
            items: [
              { name: "Your Product", quantity: 1, price: 25.00 }
            ],
            total: 25.00,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: new Date(),
            message: "This is a sample order. Real orders will appear here when customers place them."
          }
        ];
        setOrders(sampleOrders);
      } else {
        setOrders(ordersList);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const markOrderComplete = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'completed',
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'completed' as const }
            : order
        )
      );
      
      toast.success('Order marked as complete!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'cancelled',
        updatedAt: new Date()
      });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' as const }
            : order
        )
      );
      
      toast.success('Order cancelled');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const contactCustomer = (customerPhone?: string) => {
    if (!customerPhone) {
      toast.error('No phone number available');
      return;
    }
    
    // Clean phone number and create WhatsApp or SMS link
    const cleanPhone = customerPhone.replace(/[^\d+]/g, '');
    
    // Try WhatsApp first
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hello! Regarding your recent order...`;
    
    // Fallback to SMS
    const smsUrl = `sms:${cleanPhone}?body=Hello! Regarding your recent order...`;
    
    // Open WhatsApp in new tab, fallback to SMS if user cancels
    window.open(whatsappUrl, '_blank') || window.open(smsUrl, '_self');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'paid': return 'default';
      case 'cod_pending': return 'secondary';
      case 'pending_confirmation': return 'secondary';
      case 'failed': return 'destructive';
      case 'unpaid': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentStatusIcon = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'cod_pending': return <Truck className="w-4 h-4" />;
      case 'pending_confirmation': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'unpaid': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentStatusText = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'paid': return 'Paid';
      case 'cod_pending': return 'Cash on Delivery';
      case 'pending_confirmation': return 'Pending Confirmation';
      case 'failed': return 'Payment Failed';
      case 'unpaid': return 'Unpaid';
      default: return 'Unknown';
    }
  };

  // Order Card Component
  const OrderCard = ({ order, settings }: { order: Order; settings: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base truncate">{order.id}</h3>
            <div className="flex gap-2">
              <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1 w-fit">
                {getStatusIcon(order.status)}
                <span className="text-xs">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
              </Badge>
              {order.paymentStatus && (
                <Badge variant={getPaymentStatusColor(order.paymentStatus)} className="flex items-center gap-1 w-fit">
                  {getPaymentStatusIcon(order.paymentStatus)}
                  <span className="text-xs">{getPaymentStatusText(order.paymentStatus)}</span>
                </Badge>
              )}
              {order.paymentMethod && (
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  {order.paymentMethod === 'mpesa' ? <Smartphone className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                  <span className="text-xs">{order.paymentMethod.toUpperCase()}</span>
                </Badge>
              )}
            </div>
          </div>
          
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="truncate">{order.customerName}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span className="truncate">{order.customerPhone}</span>
            </p>
            <p className="text-xs sm:col-span-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{order.createdAt.toLocaleDateString()}</span>
            </p>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Items:</p>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="truncate">{item.name} x{item.quantity}</span>
                <span className="font-medium">{getCurrencySymbol(settings.currency)}{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total:</span>
              <span>{getCurrencySymbol(settings.currency)}{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {order.status === 'pending' && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => markOrderComplete(order.id)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark Complete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => contactCustomer(order.customerPhone)}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Contact Customer
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => cancelOrder(order.id)}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage all customer orders from one place
            </p>
          </div>
          <Button 
            onClick={fetchOrders} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Quick Stats - Hidden on mobile, visible on desktop */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <ShoppingBag className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                      <p className="text-2xl font-bold">{pendingOrders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{completedOrders.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">{getCurrencySymbol(settings.currency)}{totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Management Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <div className="flex flex-col space-y-4">
                {/* Mobile: Scrollable tabs, Desktop: Grid */}
                <div className="w-full overflow-x-auto">
                  <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max md:grid md:w-full md:grid-cols-4">
                    <TabsTrigger value="all" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      All Orders
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="relative whitespace-nowrap px-3 py-1.5 text-sm">
                      Pending
                      {pendingOrders.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {pendingOrders.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      Completed
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="whitespace-nowrap px-3 py-1.5 text-sm">
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search orders by ID, customer name, phone, or product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* All Orders Tab */}
              <TabsContent value="all" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      All Orders ({filteredOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No orders found</p>
                        <p>Orders will appear here when customers make purchases.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredOrders.map((order) => (
                          <OrderCard key={order.id} order={order} settings={settings} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pending Orders Tab */}
              <TabsContent value="pending" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                      Pending Orders ({pendingOrders.filter(order => 
                        searchTerm === "" || 
                        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingOrders.filter(order => 
                      searchTerm === "" || 
                      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No pending orders</p>
                        <p>All orders are processed! Great work.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingOrders
                          .filter(order => 
                            searchTerm === "" || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((order) => (
                            <OrderCard key={order.id} order={order} settings={settings} />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Completed Orders Tab */}
              <TabsContent value="completed" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      Completed Orders ({completedOrders.filter(order => 
                        searchTerm === "" || 
                        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {completedOrders.filter(order => 
                      searchTerm === "" || 
                      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No completed orders</p>
                        <p>Completed orders will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {completedOrders
                          .filter(order => 
                            searchTerm === "" || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map((order) => (
                            <OrderCard key={order.id} order={order} settings={settings} />
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                      Order Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Revenue Analytics */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Revenue Insights</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Revenue:</span>
                            <span className="font-medium">{getCurrencySymbol(settings.currency)}{totalRevenue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Order Value:</span>
                            <span className="font-medium">{getCurrencySymbol(settings.currency)}{averageOrderValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Orders Today:</span>
                            <span className="font-medium">{todayOrders.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completion Rate:</span>
                            <span className="font-medium">
                              {totalOrders > 0 ? ((completedOrders.length / totalOrders) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Status Distribution */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Order Status</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm">Completed</span>
                            </div>
                            <span className="text-sm font-medium">{completedOrders.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <span className="text-sm">Pending</span>
                            </div>
                            <span className="text-sm font-medium">{pendingOrders.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm">Cancelled</span>
                            </div>
                            <span className="text-sm font-medium">{cancelledOrders.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {totalOrders === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No Analytics Data Yet</p>
                        <p className="mb-4">Start receiving orders to see analytics here.</p>
                        <p className="text-sm">Analytics include revenue, order patterns, and customer insights.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
