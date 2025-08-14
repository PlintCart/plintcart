import React, { Suspense, lazy } from 'react';

// Placeholder chart component until real charts are implemented
const PlaceholderCharts = lazy(() => 
  Promise.resolve({
    default: ({ products, currencySymbol }: { products: any[]; currencySymbol: string }) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
          <div className="text-center">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Sales Chart</h3>
            <p className="text-blue-600">{products.length} products tracked</p>
            <p className="text-sm text-blue-500 mt-1">Currency: {currencySymbol}</p>
          </div>
        </div>
        <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center border border-green-200">
          <div className="text-center">
            <h3 className="text-lg font-medium text-green-800 mb-2">Revenue Chart</h3>
            <p className="text-green-600">Analytics coming soon</p>
            <p className="text-sm text-green-500 mt-1">Dashboard optimization in progress</p>
          </div>
        </div>
      </div>
    )
  })
);

interface LazyChartsProps {
  products: any[];
  currencySymbol: string;
}

const ChartsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
    <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
  </div>
);

export const LazyCharts: React.FC<LazyChartsProps> = ({ products, currencySymbol }) => {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <PlaceholderCharts products={products} currencySymbol={currencySymbol} />
    </Suspense>
  );
};
