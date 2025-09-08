import { can } from '../lib/roles';
import type { Role } from '../lib/roles';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { useState, useEffect } from 'react';
import { getTestRole } from '../utils/testRole';
import { 
  Package, 
  ShoppingBag, 
  BarChart3, 
  Users, 
  Settings, 
  PackageCheck,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string>('viewer');

  // Get role from user object (same logic as AdminSidebar)
  useEffect(() => {
    const getUserRole = async () => {
      if (!user) return 'viewer';
      
      // First check localStorage for development
      const localRole = getTestRole(user.uid);
      if (localRole) {
        return localRole;
      }
      
      try {
        // Fallback to Firebase custom claims for production
        await user.getIdToken(true);
        const idTokenResult = await user.getIdTokenResult();
        return (idTokenResult.claims.role as string) || 'viewer';
      } catch (error) {
        console.error('Error getting user role:', error);
        return 'viewer';
      }
    };

    const fetchRole = async () => {
      const userRole = await getUserRole();
      setRole(userRole);
    };
    
    fetchRole();
    
    // Listen for role changes
    const handleRoleChange = () => {
      fetchRole();
    };
    
    window.addEventListener('roleChanged', handleRoleChange);
    
    return () => {
      window.removeEventListener('roleChanged', handleRoleChange);
    };
  }, [user]);

  const availableFeatures = [
    {
      title: 'Products',
      description: 'Add, edit, and manage your store inventory',
      icon: Package,
      href: '/admin/products',
      available: can.manageProducts(role as Role),
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Orders',
      description: 'View and process customer orders',
      icon: ShoppingBag,
      href: '/admin/orders',
      available: can.manageOrders(role as Role),
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      title: 'Analytics',
      description: 'View sales reports and business insights',
      icon: TrendingUp,
      href: '/admin/analytics',
      available: can.viewAnalytics(role as Role),
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      title: 'Stock Management',
      description: 'Manage inventory levels and stock alerts',
      icon: PackageCheck,
      href: '/admin/stock',
      available: can.adjustStock(role as Role),
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      title: 'Store Settings',
      description: 'Configure store appearance and settings',
      icon: Settings,
      href: '/admin/settings',
      available: can.manageSettings(role as Role),
      color: 'bg-gray-50 text-gray-700 border-gray-200'
    }
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Store Owner';
      case 'manager': return 'Manager';
      case 'staff': return 'Staff Member';
      case 'cashier': return 'Cashier';
      case 'viewer': return 'Viewer';
      default: return 'Team Member';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, <span className="bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">{getRoleDisplayName(role)}</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Here are the features you have access to based on your role:
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableFeatures.map((feature) => {
            const Icon = feature.icon;
            
            return (
              <Card 
                key={feature.title}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  feature.available 
                    ? 'opacity-100 hover:scale-105' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => feature.available && navigate(feature.href)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {feature.title}
                    {!feature.available && (
                      <Shield className="h-4 w-4 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.available 
                      ? feature.description 
                      : 'Access restricted for your role'
                    }
                  </CardDescription>
                  {feature.available && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(feature.href);
                      }}
                    >
                      Open {feature.title}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Role & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              As a <strong>{getRoleDisplayName(role)}</strong>, you have access to the features highlighted above. 
              If you need access to additional features, please contact your store owner or manager.
            </p>
            
            {role === 'viewer' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You have view-only access. You can see data but cannot make changes.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
