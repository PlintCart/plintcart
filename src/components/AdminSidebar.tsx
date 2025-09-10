import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Package, 
  ShoppingBag, 
  Palette, 
  Settings, 
  BarChart3,
  Menu,
  X,
  PackageCheck,
  CreditCard,
  Users,
  Shield,
  LogOut,
  TrendingUp,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { getUserRole, setTestRole, clearTestRole } from '@/lib/zkRoles';

const navigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { name: "Stock", href: "/admin/stock", icon: PackageCheck },
  { name: "My Dashboard", href: "/staff", icon: Users }, // For staff members
  { name: "Manage Staff", href: "/staff/manage", icon: Users }, // For owners/managers
  { name: "Customize Store", href: "/admin/design", icon: Palette },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Check if user is super admin (use wallet address for zkLogin)
  const isSuperAdmin = user?.id === 'super_admin';

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }
      
      const role = await getUserRole(user.id);
      setUserRole(role);
    };
    
    fetchRole();
    
    // Listen for role changes
    const handleRoleChange = (event: CustomEvent) => {
      fetchRole();
    };
    
    window.addEventListener('roleChanged', handleRoleChange as EventListener);
    
    return () => {
      window.removeEventListener('roleChanged', handleRoleChange as EventListener);
    };
  }, [user]);

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (item.href === '/staff') {
      // Show "My Dashboard" for staff members
      return userRole === 'staff' || userRole === 'cashier' || userRole === 'manager';
    }
    if (item.href === '/staff/manage') {
      // Show "Manage Staff" for owners and managers only
      return userRole === 'owner' || userRole === 'manager';
    }
    return true;
  });

  // Check if a feature is restricted for the current user role
  const isFeatureRestricted = (href: string) => {
    if (!userRole) return false;
    
    // Features restricted to owners and managers only
    const ownerManagerOnly = ['/staff/manage', '/admin/design'];
    
    // Features restricted to staff and above (not cashiers)
    const staffAndAbove = ['/admin/products', '/admin/orders', '/admin/stock'];
    
    if (ownerManagerOnly.includes(href)) {
      return userRole !== 'owner' && userRole !== 'manager';
    }
    
    if (staffAndAbove.includes(href)) {
      return userRole === 'cashier';
    }
    
    return false;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-background border rounded-lg shadow-md"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-black/50" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full bg-background border-r border-border transition-transform duration-300 ease-in-out",
        "w-64 lg:w-64",
        // Mobile: slide in from left when open, hide when closed
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="PlintCart Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              PlintCart
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 hover:bg-accent rounded-lg transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.id?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.id || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-600">
                  {isSuperAdmin ? 'Super Admin (plint)' : `Role: ${userRole || 'No role'}`}
                </p>
              </div>
            </div>
            {/* Development role management buttons - now disabled for security */}
            <div className="mt-2 space-y-1">
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => setTestRole()}
                  disabled={true}
                  className="text-xs px-2 py-1 rounded transition-colors bg-gray-100 cursor-not-allowed opacity-60"
                  style={{ color: '#9ca3af' }}
                  title="Role management now handled server-side for security"
                >
                  Owner
                </button>
                <button 
                  onClick={() => setTestRole()}
                  disabled={true}
                  className="text-xs px-2 py-1 rounded transition-colors bg-gray-100 cursor-not-allowed opacity-60"
                  style={{ color: '#9ca3af' }}
                  title="Role management now handled server-side for security"
                >
                  Manager
                </button>
                <button 
                  onClick={() => setTestRole()}
                  disabled={true}
                  className="text-xs px-2 py-1 rounded transition-colors bg-gray-100 cursor-not-allowed opacity-60"
                  style={{ color: '#9ca3af' }}
                  title="Role management now handled server-side for security"
                >
                  Staff
                </button>
                <button 
                  onClick={() => setTestRole()}
                  disabled={true}
                  className="text-xs px-2 py-1 rounded transition-colors bg-gray-100 cursor-not-allowed opacity-60"
                  style={{ color: '#9ca3af' }}
                  title="Role management now handled server-side for security"
                >
                  Cashier
                </button>
              </div>
              <button 
                onClick={() => clearTestRole()}
                disabled={true}
                className="text-xs px-2 py-1 rounded transition-colors bg-gray-100 cursor-not-allowed opacity-60"
                style={{ color: '#9ca3af' }}
                title="Role management now handled server-side for security"
              >
                Clear Role
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const isRestricted = isFeatureRestricted(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)} // Close mobile menu on navigation
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors w-full",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground",
                  isRestricted && "opacity-60"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium flex-1">{item.name}</span>
                {isRestricted && (
                  <Lock className="h-4 w-4 text-gray-400 ml-2" />
                )}
              </NavLink>
            );
          })}

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3">
                Super Admin
              </p>
              <NavLink
                to="/super-admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors w-full",
                  location.pathname === '/super-admin'
                    ? "bg-red-600 text-white" 
                    : "hover:bg-red-50 hover:text-red-700 text-red-600"
                )}
              >
                <Shield className="h-5 w-5 mr-3" />
                <span className="font-medium">Super Dashboard</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer with logout */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}