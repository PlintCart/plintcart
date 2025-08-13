import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Clock, CheckCircle, XCircle, ShoppingBag, User, Phone, CreditCard } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
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

interface Order extends PaymentInfo {
  id: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  productName?: string;
  productPrice?: number;
  message?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'unpaid': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentStatusIcon = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'unpaid': return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and track sales</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {orders.filter(order => order.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${orders.filter(order => order.status === 'completed')
                       .reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">No orders yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    When customers place orders, they'll appear here for you to manage.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id}>
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
                            <span className="text-xs">{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</span>
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
                      <p className="text-xs sm:col-span-2">
                        <strong>Date:</strong> {order.createdAt.toLocaleDateString()}
                      </p>
                    </div>

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
                            <Button size="sm" variant="outline" className="text-xs">
                              Mark Complete
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs">
                              Cancel
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="text-xs">
                          Contact Customer
                        </Button>
                      </div>
                    </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}
