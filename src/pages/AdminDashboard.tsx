import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your store.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$3,428</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+15%</div>
              <p className="text-xs text-muted-foreground">vs last month</p>
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