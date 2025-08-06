import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Clock, CheckCircle, XCircle } from "lucide-react";

export default function Orders() {
  // Placeholder data - in a real app, this would come from your database
  const orders = [
    {
      id: "ORD-001",
      customerName: "John Doe",
      customerPhone: "+1234567890",
      items: [
        { name: "Premium T-Shirt", quantity: 2, price: 29.99 },
        { name: "Wireless Headphones", quantity: 1, price: 79.99 }
      ],
      total: 139.97,
      status: "pending",
      createdAt: new Date("2024-01-15T10:30:00"),
    },
    {
      id: "ORD-002",
      customerName: "Jane Smith",
      customerPhone: "+1234567891",
      items: [
        { name: "Coffee Blend", quantity: 3, price: 12.99 }
      ],
      total: 38.97,
      status: "completed",
      createdAt: new Date("2024-01-14T15:45:00"),
    },
    {
      id: "ORD-003",
      customerName: "Mike Johnson",
      customerPhone: "+1234567892",
      items: [
        { name: "Laptop Stand", quantity: 1, price: 45.00 }
      ],
      total: 45.00,
      status: "cancelled",
      createdAt: new Date("2024-01-13T09:15:00"),
    }
  ];

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and track sales</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold">{order.id}</h3>
                        <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p><strong>Customer:</strong> {order.customerName}</p>
                        <p><strong>Phone:</strong> {order.customerPhone}</p>
                        <p><strong>Order Date:</strong> {order.createdAt.toLocaleDateString()}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="font-medium">Items:</p>
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total:</span>
                          <span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {order.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">
                            Mark Complete
                          </Button>
                          <Button size="sm" variant="outline">
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        Contact Customer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
