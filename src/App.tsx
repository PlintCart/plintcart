
import { Suspense, lazy, useEffect, startTransition } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NetworkStatus } from "@/components/NetworkStatus";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FastLoadingSpinner } from "@/components/FastLoadingSpinner";
import { clearAllFirebaseCache } from "@/utils/clearCache";


// Critical routes - load immediately
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));

// Non-critical routes - load on demand
const NotFound = lazy(() => import("./pages/NotFound"));

const Support = lazy(() => import("./pages/Support"));

// Public pages - load normally
const Storefront = lazy(() => import("./pages/Storefront"));
const MerchantDirectory = lazy(() => import("./pages/MerchantDirectory"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PublicProductView = lazy(() => import("./pages/PublicProductView"));
const VendorStorefront = lazy(() => import("./pages/VendorStorefront"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancelled = lazy(() => import("./pages/PaymentCancelled"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));

// Admin pages - ultra lazy loading with prefetch hints
const AdminDashboard = lazy(() => 
  import(/* webpackChunkName: "admin-dashboard" */ "./pages/AdminDashboard")
);
const AddProduct = lazy(() => 
  import(/* webpackChunkName: "admin-products" */ "./pages/AddProduct")
);
const Products = lazy(() => 
  import(/* webpackChunkName: "admin-products" */ "./pages/Products")
);
const StockManagement = lazy(() => 
  import(/* webpackChunkName: "admin-stock" */ "./pages/StockManagement")
);
const Orders = lazy(() => 
  import(/* webpackChunkName: "admin-orders" */ "./pages/Orders")
);
const Analytics = lazy(() => import("./pages/Analytics"));
const Design = lazy(() =>
  import("./pages/Design").then(module => ({ default: module.default }))
);
const AdminSettings = lazy(() =>
  import("./pages/AdminSettings")
);
const MyWallet = lazy(() =>
  import("./pages/MyWallet")
);
const Subscription = lazy(() =>
  import("./pages/Subscription")
);
const StaffDashboard = lazy(() =>
  import("./pages/StaffDashboard")
);
const StaffManagement = lazy(() =>
  import("./pages/StaffManagement")
);
const AcceptInvitation = lazy(() =>
  import("./pages/AcceptInvitation")
);

// Super Admin Dashboard
const SuperAdminDashboard = lazy(() =>
  import("./pages/SuperAdminDashboard").then(module => ({ default: module.default }))
);

// Enhanced loading components for better UX
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
);

const AdminLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-64 bg-background">
    <div className="flex flex-col items-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
      <p className="text-xs text-muted-foreground">Loading admin panel...</p>
    </div>
  </div>
);




const App = () => {
  // Clear Firebase cache on app startup to ensure fresh data
  useEffect(() => {
    const shouldClearCache = sessionStorage.getItem('firebase-cache-cleared');
  const onAuthRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
  if (!shouldClearCache && !onAuthRoute) {
      clearAllFirebaseCache().then(() => {
        sessionStorage.setItem('firebase-cache-cleared', 'true');
        console.log('🔄 Firebase cache cleared for new project');
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      {/* Performance monitor removed for faster loading */}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <SettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={null}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/support" element={<Support />} />
                <Route path="/stores" element={
                  <Suspense fallback={null}>
                    <MerchantDirectory />
                  </Suspense>
                } />
                <Route path="/storefront/:merchantId" element={
                  <Suspense fallback={null}>
                    <Storefront />
                  </Suspense>
                } />
                <Route path="/store/:vendorId" element={
                  <Suspense fallback={null}>
                    <VendorStorefront />
                  </Suspense>
                } />
                <Route path="/product/:id" element={
                  <Suspense fallback={null}>
                    <PublicProductView />
                  </Suspense>
                } />
                <Route path="/checkout/:productId" element={<Checkout />} />
                <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                <Route path="/pay/:productId" element={
                  <Suspense fallback={null}>
                    <PaymentPage />
                  </Suspense>
                } />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                
                {/* Admin Routes with dedicated loading */}
                <Route path="/admin" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><AdminDashboard /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/products" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><Products /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/products/add" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><AddProduct /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/products/edit/:id" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><AddProduct /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/stock" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><StockManagement /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/orders" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><Orders /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/analytics" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><Analytics /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/design" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><Design /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/settings" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><AdminSettings /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/wallet" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><MyWallet /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/staff" element={
                  <Suspense fallback={<FastLoadingSpinner />}>
                    <ProtectedRoute><StaffDashboard /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/staff/manage" element={
                  <Suspense fallback={<FastLoadingSpinner />}>
                    <ProtectedRoute><StaffManagement /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/invite/accept" element={
                  <Suspense fallback={<FastLoadingSpinner />}>
                    <AcceptInvitation />
                  </Suspense>
                } />
                <Route path="/subscription" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><Subscription /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/super-admin" element={
                  <Suspense fallback={null}>
                    <ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>
                  </Suspense>
                } />
                
                {/* Redirect /storefront to home to prevent 404 */}
                <Route path="/storefront" element={<Index />} />
                {/* Catch-all 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </TooltipProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
      <NetworkStatus />
    </ErrorBoundary>
  );
};

export default App;
