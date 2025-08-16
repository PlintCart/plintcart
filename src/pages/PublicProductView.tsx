import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowLeft, MessageCircle, Share2, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProductSharingService } from "@/lib/productSharing";
import { Product } from "@/types/product";

// Lazy load the heavy checkout component
const OrderFirstCheckout = lazy(() => 
  import("@/components/OrderFirstCheckout").then(module => ({
    default: module.OrderFirstCheckout
  }))
);

export default function PublicProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [paymentDialogType, setPaymentDialogType] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    // Set document meta tags for better sharing
    if (product) {
      document.title = `${product.name} - ${product.businessName || 'Plint Store'}`;
      
      // Update Open Graph meta tags
      updateMetaTag('og:title', product.name);
      updateMetaTag('og:description', product.description);
      updateMetaTag('og:image', product.imageUrl);
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:type', 'product');
      
      // Twitter Card meta tags
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', product.name);
      updateMetaTag('twitter:description', product.description);
      updateMetaTag('twitter:image', product.imageUrl);
    }
  }, [product]);

  const updateMetaTag = (property: string, content: string) => {
    let element = document.querySelector(`meta[property="${property}"]`) || 
                  document.querySelector(`meta[name="${property}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        element.setAttribute('property', property);
      } else {
        element.setAttribute('name', property);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  const fetchProduct = async () => {
    try {
      // First try to find by shareableId in all products
      const productsCollection = collection(db, "products");
      const shareableIdQuery = query(productsCollection, where("shareableId", "==", id));
      let querySnapshot = await getDocs(shareableIdQuery);
      
      let productData = null;
      
      if (!querySnapshot.empty) {
        // Found by shareableId
        const docData = querySnapshot.docs[0];
        const data = docData.data();
        productData = {
          id: docData.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isVisible: data.isVisible ?? true
        } as Product;
      } else {
        // Fallback: try to find by document ID
        const productDoc = await getDoc(doc(db, "products", id!));
        if (productDoc.exists()) {
          const data = productDoc.data();
          productData = {
            id: productDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            isVisible: data.isVisible ?? true
          } as Product;
        }
      }
      
      if (productData) {
        setProduct(productData);
        
        // Fetch business settings
        const settingsDoc = await getDoc(doc(db, "settings", productData.userId));
        if (settingsDoc.exists()) {
          setBusinessSettings(settingsDoc.data());
        }
      } else {
        toast.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = () => {
    if (!product) return;
    
    const whatsappNumber = businessSettings?.whatsappNumber || product.whatsappNumber;
    const businessName = businessSettings?.businessName || product.businessName || 'Store';
    const currencySymbol = getCurrencySymbol(businessSettings?.currency || 'usd');
    
    const message = `Hi! I'd like to order:\n\n` +
      `🛍️ *${product.name}*\n` +
      `💰 Price: ${currencySymbol}${product.price}\n\n` +
      `Please confirm availability and delivery details.`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const createOrderForPayment = async () => {
    // This function is replaced by OrderFirstCheckout component
    setShowCheckout(true);
  };

  const handleOrderComplete = (orderId: string) => {
    // Close checkout modal
    setShowCheckout(false);
    
    // Start payment detection process after order completion
    setTimeout(() => {
      checkPaymentStatus();
    }, 1000); // Small delay to let UI settle
  };

  const handlePaymentConfirmation = (hasPaid: boolean) => {
    setShowPaymentConfirmation(false);
    setPaymentDialogType(hasPaid ? 'success' : 'failed');
    
    // Auto-close dialog after 5 seconds and redirect to store
    setTimeout(() => {
      setPaymentDialogType(null);
      navigate(`/store/${product?.userId}`);
    }, 5000);
  };

  const checkPaymentStatus = async () => {
    // Check for automatic payment detection after order processing
    // This simulates checking payment gateway APIs like M-Pesa, Stripe, etc.
    
    try {
      // Show loading state briefly
      toast.info('Processing payment...');
      
      // Simulate payment gateway check delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment detection - you can replace this with actual payment API calls
      // For example: checking M-Pesa transaction status, Stripe webhook confirmation, etc.
      const mockPaymentDetected = Math.random() > 0.4; // 60% chance payment is detected automatically
      
      if (mockPaymentDetected) {
        // Payment was detected automatically
        toast.success('Payment confirmed automatically!');
        setPaymentDialogType('success');
        setTimeout(() => {
          setPaymentDialogType(null);
          navigate(`/store/${product?.userId}`);
        }, 5000);
      } else {
        // Payment not detected automatically, ask customer for confirmation
        toast.info('Please confirm your payment status');
        setShowPaymentConfirmation(true);
      }
    } catch (error) {
      console.error('Payment detection failed:', error);
      // Fallback to manual confirmation if automatic detection fails
      toast.warning('Unable to detect payment automatically. Please confirm manually.');
      setShowPaymentConfirmation(true);
    }
  };

  const handleShare = async () => {
    if (!product) return;

    try {
      // Use simple sharing method with guaranteed delivery
      if (businessSettings) {
        const result = await ProductSharingService.shareProductSimple(product, businessSettings);
        
        if (result.success) {
          toast.success(result.message || 'Product shared with thumbnail and store links!');
          return;
        } else {
          // Fallback to enhanced sharing method
          const fallbackResult = await ProductSharingService.shareProductWithMessage(product, businessSettings);
          if (fallbackResult.success) {
            toast.success(fallbackResult.message || 'Product shared as thumbnail!');
            return;
          }
        }
      }

      // Fallback to regular sharing
      if (navigator.share) {
        try {
          await navigator.share({
            title: product.name,
            text: `Check out ${product.name} - ${getCurrencySymbol(businessSettings?.currency || 'usd')}${product.price}`,
            url: window.location.href
          });
        } catch (error) {
          // Fallback to copy link
          await navigator.clipboard.writeText(window.location.href);
          toast.success('Link copied to clipboard');
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      } catch (clipboardError) {
        toast.error('Failed to share product');
      }
    }
  };

  // Dedicated WhatsApp sharing with guaranteed clickable links
  const handleShareToWhatsApp = async () => {
    if (!product) return;
    
    try {
      const result = await ProductSharingService.shareProductSimple(product, businessSettings);
      if (result.success) {
        toast.success(result.message || 'WhatsApp opened with clickable product and store links!');
      } else {
        // Fallback to WhatsApp direct link
        const whatsappLink = ProductSharingService.generateWhatsAppLink(product, businessSettings || {});
        window.open(whatsappLink, '_blank');
        toast.success('WhatsApp opened with product details and clickable links!');
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      // Final fallback - direct WhatsApp link
      const whatsappLink = ProductSharingService.generateWhatsAppLink(product, businessSettings || {});
      window.open(whatsappLink, '_blank');
      toast.success('WhatsApp opened with product details!');
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'usd': return '$';
      case 'eur': return '€';
      case 'gbp': return '£';
      case 'ksh': return 'KSh';
      default: return '$';
    }
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
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Show checkout flow if triggered
  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="container max-w-4xl mx-auto py-4 sm:py-8 px-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowCheckout(false)}
              className="shrink-0 p-2 sm:p-3 h-auto"
            >
              <ArrowLeft className="w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Create your own store</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold">Complete Your Order</h1>
              <p className="text-sm sm:text-base text-muted-foreground truncate">{product.name}</p>
            </div>
          </div>

          {/* Checkout Component */}
          <Suspense fallback={
            <Card className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading checkout...</span>
              </div>
            </Card>
          }>
            <OrderFirstCheckout
              product={product}
              businessSettings={businessSettings}
              mpesaSettings={{
                enableMpesa: businessSettings?.enableMpesa ?? true,
                mpesaMethod: businessSettings?.mpesaMethod || 'paybill',
                paybillNumber: businessSettings?.paybillNumber || '174379',
                accountReference: businessSettings?.accountReference || product.name,
                tillNumber: businessSettings?.tillNumber || '',
                mpesaPhoneNumber: businessSettings?.mpesaPhoneNumber || '',
                mpesaInstructions: businessSettings?.mpesaInstructions || 'Complete payment via M-Pesa'
              }}
              onOrderComplete={handleOrderComplete}
              onCancel={() => setShowCheckout(false)}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol(businessSettings?.currency || 'usd');
  const businessName = businessSettings?.businessName || product.businessName || 'Store';
  const storeTheme = businessSettings?.storeTheme || 'modern';
  const primaryColor = businessSettings?.primaryColor || '#059669';
  const logoUrl = businessSettings?.logoUrl;
  const showBusinessInfo = businessSettings?.showBusinessInfo !== false;

  // Theme-based styling
  const getThemeClasses = () => {
    switch (storeTheme) {
      case 'elegant':
        return 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
      case 'vibrant':
        return 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50';
      case 'classic':
        return 'bg-gradient-to-br from-gray-50 via-white to-blue-50';
      default: // modern
        return 'bg-gradient-to-br from-background via-accent/10 to-background';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClasses()}`}>
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Create your own store
          </Button>
          <div className="text-center flex-1">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 mx-auto mb-1" />
            ) : (
              <h1 className="text-lg font-bold" style={{ color: primaryColor }}>
                pl<span className="text-green-600">int</span>
              </h1>
            )}
            <p className="text-xs text-muted-foreground">{businessName}</p>
          </div>
          <div className="w-[140px]"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Product Details - Professional Layout */}
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Product Image */}
            <div className="relative aspect-square bg-muted">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mx-auto mb-2" />
                    <span className="text-muted-foreground">Product Image</span>
                  </div>
                </div>
              )}
              
              {/* Price Badge */}
              <div className="absolute top-4 right-4">
                <div 
                  className="text-white px-4 py-2 rounded-lg font-bold shadow-lg text-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {currencySymbol}{product.price}
                </div>
              </div>

              {/* Featured Badge */}
              {product.featured && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-yellow-500 text-white shadow-lg">
                    ⭐ Featured
                  </Badge>
                </div>
              )}

              {/* Stock Status */}
              {product.stockQuantity !== undefined && (
                <div className="absolute bottom-4 left-4">
                  <Badge 
                    variant={product.stockQuantity > 0 ? "default" : "destructive"}
                    className="shadow-lg"
                    style={{ backgroundColor: product.stockQuantity > 0 ? primaryColor : undefined }}
                  >
                    {product.stockQuantity > 0 
                      ? `${product.stockQuantity} in stock` 
                      : 'Out of stock'
                    }
                  </Badge>
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="p-6">
              {/* Header Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
                    <Badge variant="outline" className="mt-2">{product.category}</Badge>
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              </div>

              {/* Product Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.slice(0, 4).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold mb-3 text-sm">Product Details</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">{key}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Order Button */}
                <Button 
                  className="w-full h-14 text-lg font-semibold" 
                  size="lg"
                  onClick={() => setShowCheckout(true)}
                  disabled={product.stockQuantity === 0}
                  style={{ backgroundColor: primaryColor }}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.stockQuantity === 0 ? 'Out of Stock' : 'Order Now'}
                </Button>
                
                {/* Contact Vendor Button */}
                <Button 
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-2" 
                  onClick={handleOrderNow}
                  disabled={product.stockQuantity === 0}
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact vendor
                </Button>
                
                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="h-11 text-sm" 
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-11 text-sm" 
                    onClick={() => navigate(`/store/${product.userId}`)}
                  >
                    View Store
                  </Button>
                </div>
              </div>

              {/* Business Info Footer */}
              {showBusinessInfo && (
                <div className="border-t mt-6 pt-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span>Sold by <span className="font-semibold text-foreground">{businessName}</span></span>
                    </div>
                  </div>
                  {businessSettings?.storeDescription && (
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                      {businessSettings.storeDescription}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Powered by <span className="font-semibold" style={{ color: primaryColor }}>pl<span className="text-green-600">int</span></span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold mb-4">Payment Status Check</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't automatically detect your payment. 
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please let us know if you've completed the payment for your order:
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => handlePaymentConfirmation(true)}
                className="flex-1"
                style={{ backgroundColor: businessSettings?.primaryColor || '#059669' }}
              >
                ✅ Yes, I've paid
              </Button>
              <Button 
                variant="outline"
                onClick={() => handlePaymentConfirmation(false)}
                className="flex-1"
              >
                ❌ Not yet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Success Dialog */}
      <Dialog open={paymentDialogType === 'success'} onOpenChange={() => setPaymentDialogType(null)}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold mb-4">Thank You for Shopping! 🛍️</h3>
            <p className="text-muted-foreground mb-4">
              Your payment has been confirmed! 💰✨
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                📦 If there's pending delivery, our vendor will contact you soon with the details! 📞
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Redirecting to store in 5 seconds... 🏪
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Failed Dialog */}
      <Dialog open={paymentDialogType === 'failed'} onOpenChange={() => setPaymentDialogType(null)}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-bold mb-4">Oops! Payment Not Completed</h3>
            <p className="text-muted-foreground mb-4">
              We're disappointed that you haven't completed your payment yet 💔
            </p>
            <div className="bg-orange-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-orange-800">
                💡 Don't worry! You can still contact our vendor to complete your order 📱
              </p>
            </div>
            <Button 
              onClick={() => {
                setPaymentDialogType(null);
                handleOrderNow();
              }}
              className="w-full mb-3"
              style={{ backgroundColor: businessSettings?.primaryColor || '#059669' }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Vendor Now 📞
            </Button>
            <p className="text-xs text-muted-foreground">
              Redirecting to store in 5 seconds... 🏪
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      {showCheckout && product && (
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <Suspense fallback={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }>
                <OrderFirstCheckout
                  product={product}
                  businessSettings={businessSettings}
                  mpesaSettings={{
                    enableMpesa: businessSettings?.enableMpesa ?? true,
                    mpesaMethod: businessSettings?.mpesaMethod || 'paybill',
                    paybillNumber: businessSettings?.paybillNumber || '174379',
                    accountReference: businessSettings?.accountReference || product.name,
                    tillNumber: businessSettings?.tillNumber || '',
                    mpesaPhoneNumber: businessSettings?.mpesaPhoneNumber || '',
                    mpesaInstructions: businessSettings?.mpesaInstructions || 'Complete payment via M-Pesa'
                  }}
                  onOrderComplete={handleOrderComplete}
                  onCancel={() => setShowCheckout(false)}
                />
              </Suspense>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
