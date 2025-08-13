import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { PaymentDialog } from "@/components/PaymentDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PaymentPage = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const quantity = parseInt(searchParams.get('qty') || '1');
  const amount = parseFloat(searchParams.get('amt') || '0');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      if (!productId) return;

      const productDoc = await getDoc(doc(db, "products", productId));
      if (productDoc.exists()) {
        const data = productDoc.data();
        const productData: Product = {
          id: productDoc.id,
          name: data.name,
          description: data.description || '',
          price: Number(data.price),
          imageUrl: data.imageUrl || '',
          category: data.category,
          isVisible: data.isVisible,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          userId: data.userId
        };

        setProduct(productData);

        // Verify the amount matches
        const expectedAmount = productData.price * quantity;
        if (Math.abs(amount - expectedAmount) > 0.01) {
          toast({
            title: "Price Mismatch",
            description: "The payment amount doesn't match the current product price",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Product Not Found",
          description: "The requested product could not be found",
          variant: "destructive",
        });
        navigate('/storefront');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/storefront')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Store
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/storefront')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Store
          </Button>
          <h1 className="text-2xl font-bold">Complete Your Purchase</h1>
        </div>
      </header>

      {/* Payment Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Product Information */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  {product.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{product.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    ${product.price.toFixed(2)} each
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-3">
              <h4 className="font-semibold">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>${product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Amount:</span>
                  <span className="text-primary">${(product.price * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowPaymentDialog(true)}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay with M-Pesa
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Secure payment powered by M-Pesa
              </div>
            </div>

            {/* Payment Benefits */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-medium text-green-800 mb-2">Why pay with M-Pesa?</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Instant payment confirmation</li>
                <li>✓ Secure transaction processing</li>
                <li>✓ No need to enter card details</li>
                <li>✓ Pay directly from your phone</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <PaymentDialog
          product={product}
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
        />
      )}
    </div>
  );
};

export default PaymentPage;
