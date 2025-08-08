import { Product } from '@/types/product';
import { useSettings } from '@/contexts/SettingsContext';

export interface ShareableProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  businessName: string;
  whatsappNumber?: string;
  shareUrl: string;
  currency: string;
}

export class ProductSharingService {
  private static baseUrl = window.location.origin;

  // Generate a shareable product link
  static generateShareableLink(product: Product): string {
    const shareableId = product.shareableId || product.id;
    return `${this.baseUrl}/product/${shareableId}`;
  }

  // Generate WhatsApp sharing URL with image support
  static generateWhatsAppLink(product: Product, settings: any): string {
    const shareUrl = this.generateShareableLink(product);
    const currencySymbol = this.getCurrencySymbol(settings.currency);
    const businessName = settings.businessName || 'Our Store';
    const whatsappNumber = settings.whatsappNumber;
    
    // Create a more concise message that includes the link first for preview
    const message = `🛍️ *${product.name}*\n\n` +
      `Check out this amazing product!\n\n` +
      `${shareUrl}\n\n` +
      `💰 Price: ${currencySymbol}${product.price}${product.salePrice ? ` ~~${currencySymbol}${product.salePrice}~~` : ''}\n\n` +
      `📝 ${product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}\n\n` +
      `🏪 Available at: *${businessName}*\n\n` +
      `#${product.category.replace(/\s+/g, '')} #${businessName.replace(/\s+/g, '')}`;

    const encodedMessage = encodeURIComponent(message);
    
    if (whatsappNumber) {
      return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    } else {
      return `https://wa.me/?text=${encodedMessage}`;
    }
  }

  // Generate WhatsApp link with image sharing (alternative method)
  static generateWhatsAppImageShare(product: Product, settings: any): string {
    const shareUrl = this.generateShareableLink(product);
    const currencySymbol = this.getCurrencySymbol(settings.currency);
    const businessName = settings.businessName || 'Our Store';
    const whatsappNumber = settings.whatsappNumber;
    
    // For image sharing, we create a shorter message that prioritizes the link
    const message = `🛍️ *${product.name}* - ${currencySymbol}${product.price}\n\n${shareUrl}\n\nAvailable at ${businessName}`;

    const encodedMessage = encodeURIComponent(message);
    
    if (whatsappNumber) {
      return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    } else {
      return `https://wa.me/?text=${encodedMessage}`;
    }
  }

  // Generate a copyable link with image data for manual sharing
  static async generateImageShareData(product: Product, settings: any): Promise<{
    shareUrl: string;
    message: string;
    imageUrl: string;
    canShare: boolean;
  }> {
    const shareUrl = this.generateShareableLink(product);
    const currencySymbol = this.getCurrencySymbol(settings.currency);
    const businessName = settings.businessName || 'Our Store';
    
    const message = `🛍️ *${product.name}*\n\n` +
      `💰 ${currencySymbol}${product.price}\n\n` +
      `📱 Order now: ${shareUrl}\n\n` +
      `🏪 ${businessName}`;

    return {
      shareUrl,
      message,
      imageUrl: product.imageUrl || '',
      canShare: navigator.share !== undefined
    };
  }

  // Use Web Share API when available (better for mobile)
  static async shareWithWebAPI(product: Product, settings: any): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      const shareData = await this.generateImageShareData(product, settings);
      
      await navigator.share({
        title: product.name,
        text: shareData.message,
        url: shareData.shareUrl
      });
      
      return true;
    } catch (error) {
      console.log('Error sharing:', error);
      return false;
    }
  }

  // Generate social media sharing links
  static generateSocialLinks(product: Product, settings: any) {
    const shareUrl = this.generateShareableLink(product);
    const title = `${product.name} - ${settings.businessName || 'Our Store'}`;
    const description = product.description;

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      whatsapp: this.generateWhatsAppLink(product, settings)
    };
  }

  // Get currency symbol
  private static getCurrencySymbol(currency: string): string {
    switch (currency) {
      case 'usd': return '$';
      case 'eur': return '€';
      case 'gbp': return '£';
      case 'ksh': return 'KSh';
      default: return '$';
    }
  }

  // Generate product thumbnail/card data for sharing
  static generateProductCard(product: Product, settings: any): ShareableProductData {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      businessName: settings.businessName || 'Our Store',
      whatsappNumber: settings.whatsappNumber,
      shareUrl: this.generateShareableLink(product),
      currency: settings.currency || 'usd'
    };
  }

  // Copy share link to clipboard
  static async copyShareLink(product: Product): Promise<boolean> {
    try {
      const shareUrl = this.generateShareableLink(product);
      await navigator.clipboard.writeText(shareUrl);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Generate Open Graph meta tags for product pages
  static generateMetaTags(product: Product, settings: any) {
    const shareUrl = this.generateShareableLink(product);
    const currencySymbol = this.getCurrencySymbol(settings.currency);
    
    return {
      title: `${product.name} - ${settings.businessName || 'Our Store'}`,
      description: product.description,
      image: product.imageUrl,
      url: shareUrl,
      price: `${currencySymbol}${product.price}`,
      availability: product.stockQuantity ? 'in stock' : 'limited availability',
      category: product.category
    };
  }
}
