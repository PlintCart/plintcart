import React from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { ProductSharingService } from '@/lib/productSharing';
import { getCurrencySymbol } from '@/lib/utils';

interface WhatsAppStorefrontShareProps {
  product: Product;
  businessSettings: any;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function WhatsAppStorefrontShare({ 
  product, 
  businessSettings, 
  variant = 'outline',
  size = 'default',
  className = '',
  showIcon = true,
  children 
}: WhatsAppStorefrontShareProps) {
  
  const handleWhatsAppShare = async () => {
    try {
      // Guard against undefined userId
      if (!product.userId) {
        console.warn('⚠️ Product userId is undefined, cannot generate store URL');
        toast.error('Unable to generate store link - missing user data');
        return;
      }
      
      // Generate enhanced message with only storefront link
      const storeUrl = `${window.location.origin}/store/${product.userId}`; // Only storefront link
      const currencySymbol = getCurrencySymbol(businessSettings?.currency || 'usd');
      const businessName = businessSettings?.businessName || 'Our Store';
      const whatsappNumber = businessSettings?.whatsappNumber || businessSettings?.businessPhone || '';
      
      const message = `🛍️ *${product.name}*
💰 ${currencySymbol}${product.price}

📝 ${product.description}

🏪 *${businessName}*

🏬 *🌟 VISIT OUR STORE 🌟*
${storeUrl}

${whatsappNumber ? `📞 Contact Us: ${whatsappNumber}` : ''}

_✨ Visit our store to see all our amazing products! ✨_

#${businessName.replace(/\s+/g, '')} #${product.category?.replace(/\s+/g, '') || 'Products'}`;

      // Try to share with thumbnail first
      try {
        const result = await ProductSharingService.shareProductSimple(product, businessSettings);
        if (result.success) {
          toast.success('WhatsApp opened with product thumbnail and store link!');
          return;
        }
      } catch (thumbnailError) {
        console.log('Thumbnail sharing failed, using text-only sharing');
      }

      // Fallback to WhatsApp with enhanced message
      const whatsappUrl = whatsappNumber 
        ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
      toast.success('WhatsApp opened with product details and storefront link!');
      
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error('Failed to open WhatsApp. Please try again.');
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

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleWhatsAppShare}
      className={`${variant === 'outline' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''} ${className}`}
    >
      {showIcon && <Smartphone className="w-4 h-4 mr-2" />}
      {children || 'Share to WhatsApp'}
    </Button>
  );
}

// Store-only sharing component
interface StorefrontShareProps {
  userId: string;
  businessSettings: any;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function StorefrontShare({ 
  userId, 
  businessSettings, 
  variant = 'outline',
  size = 'default',
  className = ''
}: StorefrontShareProps) {
  
  const handleStorefrontShare = () => {
    const storeUrl = `${window.location.origin}/store/${userId}`;
    const businessName = businessSettings?.businessName || 'Our Store';
    const whatsappNumber = businessSettings?.whatsappNumber || businessSettings?.businessPhone || '';
    
    const message = `🏪 *${businessName}* - Online Store

🛍️ Check out our amazing collection of products!

🌟 *VISIT OUR STORE:* ${storeUrl}

${whatsappNumber ? `📞 Contact Us: ${whatsappNumber}` : ''}

_✨ Click the link above to browse all our products! ✨_

#${businessName.replace(/\s+/g, '')} #OnlineStore #Shopping`;

    const whatsappUrl = whatsappNumber 
      ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp opened with storefront link!');
  };

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleStorefrontShare}
      className={`${variant === 'outline' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''} ${className}`}
    >
      <ExternalLink className="w-4 h-4 mr-2" />
      Share Store
    </Button>
  );
}
