import { useState } from "react";
import { Product } from "@/types/product";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, ShoppingCart, CreditCard, Link2, Copy } from "lucide-react";
import { PaymentDialog } from "@/components/PaymentDialog";
import { PaymentLinkService } from "@/services/PaymentLinkService";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onShare?: () => void;
  onOrder?: () => void;
  showShareButton?: boolean;
  showOrderButton?: boolean;
  showPaymentButton?: boolean;
}

const ProductCard = ({ 
  product, 
  viewMode = 'grid', 
  onShare, 
  onOrder,
  showShareButton = false,
  showOrderButton = true,
  showPaymentButton = true
}: ProductCardProps) => {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const { toast } = useToast();

  const handleOrder = () => {
    if (onOrder) {
      onOrder();
    } else {
      // Default WhatsApp order flow
      const message = `Hi! I'd like to order ${product.name} for $${product.price.toFixed(2)}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handlePayNow = async () => {
    // Load payment settings with error handling
    try {
      const settingsDoc = await getDoc(doc(db, "settings", product.userId));
      if (settingsDoc.exists()) {
        setPaymentSettings(settingsDoc.data());
      }
      setShowPaymentDialog(true);
    } catch (error) {
      console.error("Error loading payment settings:", error);
      // Show dialog anyway, it will handle missing settings
      setShowPaymentDialog(true);
      toast({
        title: "Notice",
        description: "Payment settings could not be loaded. Some features may be limited.",
        variant: "default",
      });
    }
  };

  const handleSharePaymentLink = async () => {
    try {
      let settings = {};
      try {
        const settingsDoc = await getDoc(doc(db, "settings", product.userId));
        settings = settingsDoc.exists() ? settingsDoc.data() : {};
      } catch (settingsError) {
        console.warn("Could not load settings for payment link:", settingsError);
        // Continue with empty settings
      }
      
      await PaymentLinkService.sharePaymentLink(product, settings, 1);
      toast({
        title: "Payment link shared",
        description: "WhatsApp opened with payment link",
      });
    } catch (error) {
      console.error("Error sharing payment link:", error);
      toast({
        title: "Error",
        description: "Could not share payment link",
        variant: "destructive",
      });
    }
  };

  const handleCopyPaymentLink = async () => {
    try {
      let settings = {};
      try {
        const settingsDoc = await getDoc(doc(db, "settings", product.userId));
        settings = settingsDoc.exists() ? settingsDoc.data() : {};
      } catch (settingsError) {
        console.warn("Could not load settings for payment link:", settingsError);
        // Continue with empty settings
      }
      
      const success = await PaymentLinkService.copyPaymentLink(product, settings, 1);
      if (success) {
        toast({
          title: "Link copied",
          description: "Payment link copied to clipboard",
        });
      } else {
        throw new Error("Failed to copy link");
      }
    } catch (error) {
      console.error("Error copying payment link:", error);
      toast({
        title: "Error",
        description: "Could not copy payment link",
        variant: "destructive",
      });
    }
  };

  if (viewMode === 'list') {
    return (
      <Card className="flex flex-row overflow-hidden hover:shadow-lg transition-shadow">
        <div className="w-32 h-32 flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between p-4">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <Badge variant="secondary">{product.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {product.description}
            </p>
            <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
          </div>
          <div className="flex gap-2 mt-4">
            {showPaymentButton && (
              <Button onClick={handlePayNow} variant="default" className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            {showOrderButton && (
              <Button onClick={handleOrder} variant="outline" className="flex-1">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Order
              </Button>
            )}
            {showShareButton && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Product
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSharePaymentLink}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Share Payment Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyPaymentLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Payment Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
        <Badge className="absolute top-2 right-2" variant="secondary">
          {product.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.description}
        </p>
        <p className="text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        {showPaymentButton && (
          <Button onClick={handlePayNow} variant="default" className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        )}
        {showOrderButton && (
          <Button onClick={handleOrder} variant="outline" className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order
          </Button>
        )}
        {showShareButton && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSharePaymentLink}>
                <Link2 className="h-4 w-4 mr-2" />
                Share Payment Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyPaymentLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Payment Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
      
      {/* Payment Dialog */}
      {showPaymentDialog && (
        <PaymentDialog
          product={product}
          isOpen={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
        />
      )}
    </Card>
  );
};

export default ProductCard;