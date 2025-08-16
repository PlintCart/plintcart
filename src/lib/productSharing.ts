import { Product } from '@/types/product';
import { ProductThumbnailGenerator } from './productThumbnailGenerator';

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

export interface ShareResult {
  success: boolean;
  message?: string;
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
    const storeUrl = `${this.baseUrl}/store/${product.userId}`; // Only storefront link
    const currencySymbol = this.getCurrencySymbol(settings.currency);
    const businessName = settings.businessName || 'Our Store';
    const whatsappNumber = settings.whatsappNumber;
    
    // Create a message that only includes the storefront link (no admin/merchant links)
    const message = `🛍️✨ *${product.name}* ✨🛍️\n\n` +
      `🌟 Check out this amazing product! 🌟\n\n` +
      `💰💳 *Price:* ${currencySymbol}${product.price}${product.salePrice ? ` 🔥 ~~${currencySymbol}${product.salePrice}~~ 🔥` : ''}\n\n` +
      `📝✨ *Description:* ${product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}\n\n` +
      `🏪🛒 *Visit our store:* ${storeUrl}\n\n` +
      `🏢✨ Available at: *${businessName}* ✨\n\n` +
      `🏷️ #${product.category.replace(/\s+/g, '')} #${businessName.replace(/\s+/g, '')} 🏷️`;

    const encodedMessage = encodeURIComponent(message);
    
    if (whatsappNumber) {
      return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    } else {
      return `https://wa.me/?text=${encodedMessage}`;
    }
  }

  // Generate WhatsApp link with image sharing (alternative method)
  static generateWhatsAppImageShare(product: Product, settings: any): string {
    const storeUrl = `${this.baseUrl}/store/${product.userId}`; // Only storefront link
    const currencySymbol = this.getCurrencySymbol(settings.currency);
    const businessName = settings.businessName || 'Our Store';
    const whatsappNumber = settings.whatsappNumber;
    
    // For image sharing, we create a shorter message that only includes storefront link
    const message = `🛍️✨ *${product.name}* ✨ - 💰 ${currencySymbol}${product.price}\n\n🏪🛒 *Visit our store:* ${storeUrl}\n\n🏢✨ Available at ${businessName} ✨`;

    const encodedMessage = encodeURIComponent(message);
    
    if (whatsappNumber) {
      return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    } else {
      return `https://wa.me/?text=${encodedMessage}`;
    }
  }

  // Generate product thumbnail using the ProductThumbnailGenerator
  static async generateProductThumbnail(product: Product, businessSettings: any): Promise<Blob> {
    const thumbnailDataUrl = await ProductThumbnailGenerator.generateProductThumbnail(product, {
      businessName: businessSettings?.businessName || 'Our Store',
      currency: businessSettings?.currency || 'usd',
      primaryColor: businessSettings?.primaryColor || '#059669',
      storeTheme: businessSettings?.storeTheme || 'modern'
    });
    
    // Convert data URL to blob
    const response = await fetch(thumbnailDataUrl);
    return response.blob();
  }

  // Generate and share product thumbnail image
  static async shareProductThumbnail(product: Product, businessSettings: any): Promise<ShareResult> {
    try {
      // Generate thumbnail
      const thumbnailBlob = await this.generateProductThumbnail(product, businessSettings);
      
      // Create comprehensive sharing message with only storefront link
      const storeUrl = `${window.location.origin}/store/${product.userId}`; // Only storefront link
      const currencySymbol = this.getCurrencySymbol(businessSettings?.currency || 'usd');
      const businessName = businessSettings?.businessName || 'Our Store';
      const whatsappNumber = businessSettings?.whatsappNumber || businessSettings?.businessPhone || '';
      
      // Enhanced message with only storefront link (no admin/merchant links)
      const message = `🛍️✨ *${product.name}* ✨

💰💳 *Price:* ${currencySymbol}${product.price}${product.salePrice ? ` 🔥 (Sale: ${currencySymbol}${product.salePrice}) 🔥` : ''}

📝✨ *Description:* ${product.description}

�✨ *${businessName}* ✨

�🛒 *Visit Our Store:* ${storeUrl}

${product.tags && product.tags.length > 0 ? `🏷️ ${product.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')} #${businessName.replace(/\s+/g, '')} 🏷️` : ''}

${whatsappNumber ? `📞💬 *Contact:* ${whatsappNumber}` : ''}`;

      // Strategy 1: Try downloading image + opening WhatsApp with message (most reliable)
      try {
        // Download the thumbnail image
        const imageUrl = URL.createObjectURL(thumbnailBlob);
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}-thumbnail.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(imageUrl);

        // Open WhatsApp with the detailed message
        const whatsappUrl = whatsappNumber 
          ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');

        return { 
          success: true, 
          message: 'Thumbnail downloaded! WhatsApp opened with product details and store link. Send the image first, then the message.' 
        };
      } catch (downloadError) {
        console.log('Download failed, trying clipboard method');
      }

      // Strategy 2: Copy image to clipboard + copy message + open WhatsApp
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          // Copy image to clipboard
          await navigator.clipboard.write([
            new window.ClipboardItem({
              'image/png': thumbnailBlob
            })
          ]);

          // Small delay then copy the message text
          setTimeout(async () => {
            try {
              await navigator.clipboard.writeText(message);
            } catch (e) {
              console.log('Failed to copy message to clipboard');
            }
          }, 1000);

          // Open WhatsApp
          const whatsappUrl = whatsappNumber 
            ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
          
          window.open(whatsappUrl, '_blank');

          return { 
            success: true, 
            message: 'Thumbnail copied to clipboard! WhatsApp opened with product details. Paste the image first, then the message will be ready.' 
          };
        } catch (clipboardError) {
          console.log('Clipboard failed, trying Web Share API');
        }
      }

      // Strategy 3: Try Web Share API (if available)
      if (navigator.share) {
        try {
          // First share the image
          const shareData = {
            title: `${product.name} - ${businessName}`,
            files: [new File([thumbnailBlob], `${product.name}-thumbnail.png`, { type: 'image/png' })]
          };

          await navigator.share(shareData);
          
          // Small delay then share the message
          setTimeout(async () => {
            try {
              await navigator.share({
                title: `${product.name} Details`,
                text: message
              });
            } catch (e) {
              // Copy message as fallback
              try {
                await navigator.clipboard.writeText(message);
              } catch (clipError) {
                console.log('Failed to copy message');
              }
            }
          }, 2000);

          return { 
            success: true, 
            message: 'Thumbnail shared! Product details and store link will follow shortly.' 
          };
        } catch (shareError) {
          console.log('Web Share API failed');
        }
      }

      // Strategy 4: Final fallback - copy both to clipboard with instructions
      try {
        // Copy the detailed message
        await navigator.clipboard.writeText(message);
        
        // Download the image
        const imageUrl = URL.createObjectURL(thumbnailBlob);
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}-thumbnail.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(imageUrl);

        return { 
          success: true, 
          message: 'Thumbnail downloaded and product details copied to clipboard! Share the image and paste the message with store link.' 
        };
      } catch (fallbackError) {
        console.error('All sharing methods failed:', fallbackError);
        return { 
          success: false, 
          message: 'Failed to share product. Please try again.' 
        };
      }

    } catch (error) {
      console.error('Error sharing product thumbnail:', error);
      
      // Final text-only fallback
      try {
        const productUrl = `${window.location.origin}/product/${product.shareableId || product.id}`;
        const storeUrl = `${window.location.origin}/store/${product.userId}`;
        const currencySymbol = this.getCurrencySymbol(businessSettings?.currency || 'usd');
        const businessName = businessSettings?.businessName || 'Our Store';
        
        const fallbackMessage = `🛍️ ${product.name} - ${currencySymbol}${product.price}

${product.description}

🏪 ${businessName}
🔗 Product: ${productUrl}
🏬 Store: ${storeUrl}`;

        await navigator.clipboard.writeText(fallbackMessage);
        return { 
          success: true, 
          message: 'Product details and links copied to clipboard!' 
        };
      } catch (finalError) {
        return { 
          success: false, 
          message: 'Failed to share product. Please try again.' 
        };
      }
    }
  }

  // Share product with guaranteed text message (simpler approach)
  static async shareProductWithMessage(product: Product, businessSettings: any): Promise<ShareResult> {
    try {
      // Generate thumbnail
      const thumbnailBlob = await this.generateProductThumbnail(product, businessSettings);
      
      // Create message
      const productUrl = `${window.location.origin}/product/${product.shareableId || product.id}`;
      const storeUrl = `${window.location.origin}/store/${product.userId}`;
      const currencySymbol = this.getCurrencySymbol(businessSettings?.currency || 'usd');
      const businessName = businessSettings?.businessName || 'Our Store';
      const whatsappNumber = businessSettings?.whatsappNumber || businessSettings?.businessPhone || '';
      
      const message = `🛍️ *${product.name}*

💰 ${currencySymbol}${product.price}${product.salePrice ? ` (Sale: ${currencySymbol}${product.salePrice})` : ''}

📝 ${product.description}

🏪 *${businessName}*

🔗 Product: ${productUrl}

🏬 Full Store: ${storeUrl}

${whatsappNumber ? `📞 ${whatsappNumber}` : ''}

#${product.category?.replace(/\s+/g, '') || 'Product'} #${businessName.replace(/\s+/g, '')}`;

      // Strategy 1: Try Web Share API with file first (best for mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([thumbnailBlob], `${product.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}-thumbnail.png`, { 
            type: 'image/png' 
          });
          
          const shareData = {
            title: `${product.name} - ${businessName}`,
            text: message,
            files: [file]
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return { 
              success: true, 
              message: 'Product shared with thumbnail and store links!' 
            };
          }
        } catch (shareError) {
          console.log('Web Share API with files failed, trying without files');
        }

        // Fallback: Share just the text message
        try {
          await navigator.share({
            title: `${product.name} - ${businessName}`,
            text: message
          });
          
          // Copy image to clipboard as backup
          if (navigator.clipboard && window.ClipboardItem) {
            try {
              await navigator.clipboard.write([
                new window.ClipboardItem({
                  'image/png': thumbnailBlob
                })
              ]);
            } catch (clipError) {
              console.log('Could not copy image to clipboard');
            }
          }

          return { 
            success: true, 
            message: 'Message shared with store links! Image copied to clipboard - paste it in your chat.' 
          };
        } catch (textShareError) {
          console.log('Text sharing also failed');
        }
      }

      // Strategy 2: Copy image to clipboard + open WhatsApp with message
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new window.ClipboardItem({
              'image/png': thumbnailBlob
            })
          ]);

          // Open WhatsApp with the message
          const whatsappUrl = whatsappNumber 
            ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
          
          window.open(whatsappUrl, '_blank');

          return { 
            success: true, 
            message: 'Image copied to clipboard and WhatsApp opened with product details! Paste the image first, then send the message.' 
          };
        } catch (clipboardError) {
          console.log('Clipboard failed');
        }
      }

      // Strategy 3: Create a blob URL and try to open it for manual sharing
      try {
        const imageUrl = URL.createObjectURL(thumbnailBlob);
        
        // Copy the message first
        await navigator.clipboard.writeText(message);
        
        // Open image in new tab for manual sharing
        const imageWindow = window.open('', '_blank');
        if (imageWindow) {
          imageWindow.document.write(`
            <html>
              <head><title>${product.name} - Share Image</title></head>
              <body style="margin:0; padding:20px; text-align:center; font-family:Arial;">
                <h3>Right-click to save or share this image:</h3>
                <img src="${imageUrl}" alt="${product.name}" style="max-width:100%; height:auto;" />
                <p><strong>Product details copied to clipboard!</strong></p>
                <p>1. Save this image or copy it</p>
                <p>2. Share the image in your messaging app</p>
                <p>3. Paste the copied message with product details and store links</p>
              </body>
            </html>
          `);
        }

        // Clean up the URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(imageUrl);
        }, 300000); // 5 minutes

        return { 
          success: true, 
          message: 'Image opened in new tab and message copied! Right-click to save/share the image, then paste the message.' 
        };
      } catch (blobError) {
        console.log('Blob URL creation failed');
      }

      // Strategy 4: Final fallback - just copy the message with instructions
      await navigator.clipboard.writeText(message);
      return { 
        success: true, 
        message: 'Product details and store links copied to clipboard! Please take a screenshot to share the visual along with this message.' 
      };

    } catch (error) {
      console.error('Error sharing product:', error);
      return { 
        success: false, 
        message: 'Failed to share product. Please try again.' 
      };
    }
  }

  // Simple and effective sharing method
  static async shareProductSimple(product: Product, businessSettings: any): Promise<ShareResult> {
    try {
      // Generate thumbnail
      const thumbnailBlob = await this.generateProductThumbnail(product, businessSettings);
      
      // Create message with only storefront link
      const storeUrl = `${window.location.origin}/store/${product.userId}`; // Only storefront link
      const currencySymbol = this.getCurrencySymbol(businessSettings?.currency || 'usd');
      const businessName = businessSettings?.businessName || 'Our Store';
      const whatsappNumber = businessSettings?.whatsappNumber || businessSettings?.businessPhone || '';
      
      const message = `🛍️✨ *${product.name}* ✨🛍️

💰💳 ${currencySymbol}${product.price}

📝✨ ${product.description}

🏪✨ ${businessName} ✨
🏬🛒 Visit our store: ${storeUrl}

${whatsappNumber ? `📞💬 ${whatsappNumber}` : ''}`;

      // Try native sharing first (works best on mobile)
      if (navigator.share) {
        try {
          const file = new File([thumbnailBlob], `${product.name}-thumbnail.png`, { type: 'image/png' });
          
          await navigator.share({
            title: product.name,
            text: message,
            files: [file]
          });
          
          return { 
            success: true, 
            message: 'Product shared successfully with image and store links!' 
          };
        } catch (shareError) {
          // Fallback to text only sharing
          try {
            await navigator.share({
              title: product.name,
              text: message
            });
            
            return { 
              success: true, 
              message: 'Product details shared! The image is ready in your clipboard to paste.' 
            };
          } catch (textError) {
            console.log('Native sharing failed, trying clipboard');
          }
        }
      }

      // Clipboard approach (works on desktop)
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          // Copy image to clipboard
          await navigator.clipboard.write([
            new window.ClipboardItem({
              'image/png': thumbnailBlob
            })
          ]);
          
          // Copy text to clipboard after a short delay
          setTimeout(async () => {
            try {
              await navigator.clipboard.writeText(message);
            } catch (e) {
              console.log('Failed to copy text');
            }
          }, 500);

          return { 
            success: true, 
            message: 'Product image copied to clipboard! Text with store links will be copied shortly. Paste the image first, then the text.' 
          };
        } catch (clipboardError) {
          console.log('Clipboard failed');
        }
      }

      // Final fallback - copy text and open image
      await navigator.clipboard.writeText(message);
      
      const imageUrl = URL.createObjectURL(thumbnailBlob);
      window.open(imageUrl, '_blank');
      
      setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
      }, 60000);

      return { 
        success: true, 
        message: 'Product details copied and image opened! Save the image and share both the image and copied text.' 
      };

    } catch (error) {
      console.error('Error sharing product:', error);
      return { 
        success: false, 
        message: 'Failed to share product. Please try again.' 
      };
    }
  }

  // Quick share method for immediate use
  static async quickShare(product: Product, businessSettings: any): Promise<ShareResult> {
    try {
      const thumbnailBlob = await this.generateProductThumbnail(product, businessSettings);
      const productUrl = `${window.location.origin}/product/${product.shareableId || product.id}`;
      const storeUrl = `${window.location.origin}/store/${product.userId}`;
      const currencySymbol = this.getCurrencySymbol(businessSettings?.currency || 'usd');
      const businessName = businessSettings?.businessName || 'Our Store';
      
      const message = `🛍️ ${product.name} - ${currencySymbol}${product.price}

${product.description}

🔗 Product: ${productUrl}
🏬 Store: ${storeUrl}
🏪 ${businessName}`;

      // Copy image to clipboard
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new window.ClipboardItem({
            'image/png': thumbnailBlob
          })
        ]);
      }

      // Copy message 
      await navigator.clipboard.writeText(message);

      return { 
        success: true, 
        message: '✅ Ready to share! Image and message copied to clipboard. Paste the image first, then the text with store links.' 
      };

    } catch (error) {
      console.error('Error in quick share:', error);
      return { 
        success: false, 
        message: 'Failed to prepare sharing content. Please try again.' 
      };
    }
  }

  // Download thumbnail image
  static downloadThumbnail(dataUrl: string, productName: string): void {
    const link = document.createElement('a');
    link.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_thumbnail.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    
    const message = `🛍️✨ *${product.name}* ✨🛍️\n\n` +
      `💰💳 ${currencySymbol}${product.price}\n\n` +
      `📱🛒 Order now: ${shareUrl}\n\n` +
      `🏪✨ ${businessName} ✨`;

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
