import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product';
import { OrderFirstCheckout } from '@/components/OrderFirstCheckout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Checkout = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchProductAndSettings(productId);
    }
  }, [productId]);

  const fetchProductAndSettings = async (id: string) => {
    try {
      console.log('Fetching product with ID:', id);
      
      // Fetch product
      const productDoc = await getDoc(doc(db, 'products', id));
      if (!productDoc.exists()) {
        console.error('Product not found with ID:', id);
        throw new Error('Product not found');
      }

      const productData = productDoc.data();
      console.log('Product data fetched:', productData);
      
      const productObj: Product = {
        id: productDoc.id, // Use document ID, not data.id
        name: productData.name || '',
        description: productData.description || '',
        price: Number(productData.price) || 0,
        imageUrl: productData.imageUrl || productData.image_url || '', // Handle both field names
        category: productData.category || '',
        isVisible: productData.isVisible !== false, // Default to true
        createdAt: productData.createdAt ? new Date(productData.createdAt) : new Date(),
        updatedAt: productData.updatedAt ? new Date(productData.updatedAt) : new Date(),
        userId: productData.userId || productData.user_id || '', // Handle both field names
        stockQuantity: productData.stockQuantity || productData.stock_quantity,
        shareableId: productData.shareableId || productData.shareable_id
      };
      
      console.log('Processed product object:', productObj);
      setProduct(productObj);

      // Fetch business settings for the product owner
      const userId = productObj.userId;
      console.log('Fetching settings for user:', userId);
      
      if (userId) {
        const settingsDoc = await getDoc(doc(db, 'settings', userId));
        if (settingsDoc.exists()) {
          const settingsData = settingsDoc.data();
          console.log('Business settings fetched:', settingsData);
          setBusinessSettings(settingsData);
        } else {
          console.log('No business settings found, using defaults');
          setBusinessSettings({
            enableMpesa: true,
            currency: 'KES',
            businessName: 'Store'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderComplete = (orderId: string) => {
    navigate(`/order-success/${orderId}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-muted-foreground mb-4">Product not found</h2>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Order</h1>
          
          {product ? (
            <OrderFirstCheckout
                product={product}
                businessSettings={businessSettings || {}}
                mpesaSettings={{
                  enableMpesa: businessSettings?.enableMpesa ?? true,
                  mpesaMethod: businessSettings?.mpesaMethod || 'paybill',
                  paybillNumber: businessSettings?.paybillNumber || '',
                  accountReference: businessSettings?.accountReference || '',
                  tillNumber: businessSettings?.tillNumber || '',
                  mpesaPhoneNumber: businessSettings?.mpesaPhoneNumber || '',
                  mpesaInstructions: businessSettings?.mpesaInstructions || 'Complete payment via M-Pesa'
                }}
                onOrderComplete={handleOrderComplete}
                onCancel={handleCancel}
              />
          ) : (
            <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">Product data not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
