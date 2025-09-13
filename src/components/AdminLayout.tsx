import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Outlet } from 'react-router-dom';

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}