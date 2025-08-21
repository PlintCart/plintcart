import { useState } from "react";
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
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { name: "Stock", href: "/admin/stock", icon: PackageCheck },
  { name: "Customize Store", href: "/admin/design", icon: Palette },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  // Check if user is super admin
  // Superadmin login: must log in with the special email or UID (e.g., admin@plint.com or super_admin)
  // You can set this in Firebase Auth or your user management system
  const isSuperAdmin = user?.email === 'admin@plint.com' || user?.uid === 'super_admin';

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
            <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PL</span>
            </div>
            <span className="font-bold text-lg">plint</span>
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
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-600">
                  {isSuperAdmin ? 'Super Admin (plint)' : 'Admin'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)} // Close mobile menu on navigation
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors w-full",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.name}</span>
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