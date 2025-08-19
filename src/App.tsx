import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NetworkStatus } from "@/components/NetworkStatus";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load pages for better performance with route-based splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));

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

// Admin pages - split into separate chunks for better caching
const AdminDashboard = lazy(() => 
  import("./pages/AdminDashboard").then(module => ({ default: module.default }))
);
const AddProduct = lazy(() => 
  import("./pages/AddProduct").then(module => ({ default: module.default }))
);
const Products = lazy(() => 
  import("./pages/Products").then(module => ({ default: module.default }))
);
const StockManagement = lazy(() => 
  import("./pages/StockManagement").then(module => ({ default: module.default }))
);
const Orders = lazy(() => 
  import("./pages/Orders").then(module => ({ default: module.default }))
);
const Design = lazy(() => 
  import("./pages/Design").then(module => ({ default: module.default }))
);
const AdminSettings = lazy(() => 
  import("./pages/AdminSettings").then(module => ({ default: module.default }))
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

// Route-specific loading components for better perceived performance
const AdminLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/20 border-t-blue-600"></div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading admin panel...</p>
    </div>
  </div>
);

const PublicLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600/20 border-t-green-600"></div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading storefront...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <PerformanceMonitor />
      <AuthProvider>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/stores" element={
                  <Suspense fallback={<PublicLoadingSpinner />}>
                    <MerchantDirectory />
                  </Suspense>
                } />
                <Route path="/storefront/:merchantId" element={
                  <Suspense fallback={<PublicLoadingSpinner />}>
                    <Storefront />
                  </Suspense>
                } />
                <Route path="/store/:vendorId" element={
                  <Suspense fallback={<PublicLoadingSpinner />}>
                    <VendorStorefront />
                  </Suspense>
                } />
                <Route path="/product/:id" element={
                  <Suspense fallback={<PublicLoadingSpinner />}>
                    <PublicProductView />
                  </Suspense>
                } />
                <Route path="/checkout/:productId" element={<Checkout />} />
                <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                <Route path="/pay/:productId" element={
                  <Suspense fallback={<PublicLoadingSpinner />}>
                    <PaymentPage />
                  </Suspense>
                } />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                
                {/* Admin Routes with dedicated loading */}
                <Route path="/admin" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><AdminDashboard /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/products" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><Products /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/products/add" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><AddProduct /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/products/edit/:id" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><AddProduct /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/stock" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><StockManagement /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/orders" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><Orders /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/design" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><Design /></ProtectedRoute>
                  </Suspense>
                } />
                <Route path="/admin/settings" element={
                  <Suspense fallback={<AdminLoadingSpinner />}>
                    <ProtectedRoute><AdminSettings /></ProtectedRoute>
                  </Suspense>
                } />
                
                {/* Catch-all 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <NetworkStatus />
        </TooltipProvider>
      </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
