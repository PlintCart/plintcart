import { Product } from "@/types/product";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onShare?: () => void;
  onOrder?: () => void;
  showShareButton?: boolean;
  showOrderButton?: boolean;
}

const ProductCard = ({ 
  product, 
  viewMode = 'grid', 
  onShare, 
  onOrder,
  showShareButton = false,
  showOrderButton = true 
}: ProductCardProps) => {
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
            {showOrderButton && (
              <Button onClick={handleOrder} className="flex-1">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Order Now
              </Button>
            )}
            {showShareButton && (
              <Button variant="outline" size="sm" onClick={onShare}>
                <Share2 className="h-4 w-4" />
              </Button>
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
        {showOrderButton && (
          <Button onClick={handleOrder} className="flex-1">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order Now
          </Button>
        )}
        {showShareButton && (
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;