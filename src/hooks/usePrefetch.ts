// Route prefetching utility for improved performance
import { lazy } from 'react';

// Prefetch critical routes based on user behavior patterns
export const prefetchRoutes = {
  // Prefetch admin routes when user navigates to /admin
  admin: () => {
    import('../pages/Products');
    import('../pages/AddProduct'); 
    import('../pages/StockManagement');
  },
  
  // Prefetch public routes when user lands on homepage
  public: () => {
    import('../pages/Storefront');
    import('../pages/MerchantDirectory');
  },
  
  // Prefetch payment flow when user views products
  payment: () => {
    import('../pages/PaymentPage');
    import('../pages/PaymentSuccess');
  }
};

// Smart prefetching hook
export const usePrefetch = () => {
  const prefetchOnHover = (routeGroup: keyof typeof prefetchRoutes) => {
    return {
      onMouseEnter: () => {
        // Prefetch on hover with a small delay
        setTimeout(() => {
          prefetchRoutes[routeGroup]();
        }, 100);
      }
    };
  };

  const prefetchOnVisible = (routeGroup: keyof typeof prefetchRoutes) => {
    // Prefetch when element comes into view
    return {
      onFocus: () => prefetchRoutes[routeGroup](),
    };
  };

  return { prefetchOnHover, prefetchOnVisible };
};
