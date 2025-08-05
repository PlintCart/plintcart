import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Package, 
  ShoppingBag, 
  Palette, 
  Settings, 
  BarChart3,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: BarChart3 },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Design", href: "/admin/design", icon: Palette },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/50" onClick={() => setCollapsed(true)} />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full bg-background border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <h1 className="text-xl font-bold text-primary">Take.App</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "mr-3")} />
                {!collapsed && <span className="font-medium">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Mobile toggle button */}
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 bg-background border rounded-lg shadow-md"
      >
        <Menu className="h-5 w-5" />
      </button>
    </>
  );
}