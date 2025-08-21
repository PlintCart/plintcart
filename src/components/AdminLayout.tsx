import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  // Navigation items for reference
  const navigationItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Products', href: '/admin/products' },
    { name: 'Orders', href: '/admin/orders' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  const currentPageName = navigationItems.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen">
        {/* Admin Top Bar */}
        <div className="bg-white shadow-sm border-b px-6 py-4 lg:ml-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {currentPageName}
            </h1>
            
            {/* Removed Add Product and View Store buttons */}
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}