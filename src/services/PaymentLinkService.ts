import { Product } from "@/types/product";
import html2canvas from "html2canvas";

export interface PaymentLinkData {
  productId: string;
  productName: string;
  price: number;
  imageUrl: string;
  merchantId: string;
  quantity?: number;
}

export class PaymentLinkService {
  /**
   * Generate a payment link with product thumbnail
   */
  static async generatePaymentLink(
    product: Product, 
    paymentSettings: any,
    quantity: number = 1
  ): Promise<{ success: boolean; link?: string; message?: string }> {
    try {
      const totalAmount = product.price * quantity;
      
      // Create payment data
      const paymentData: PaymentLinkData = {
        productId: product.id,
        productName: product.name,
        price: totalAmount,
        imageUrl: product.imageUrl || '',
        merchantId: product.userId,
        quantity
      };

      // Generate payment URL with encoded data
      const baseUrl = window.location.origin;
      const paymentUrl = `${baseUrl}/pay/${product.id}?qty=${quantity}&amt=${totalAmount}`;
      
      // Create shareable message with payment link
      const message = this.createPaymentMessage(product, totalAmount, quantity, paymentUrl);
      
      // Generate thumbnail if possible
      const thumbnail = await this.generateProductThumbnail(product, totalAmount, quantity);
      
      return {
        success: true,
        link: paymentUrl,
        message: `Payment link generated: ${message}`
      };
    } catch (error) {
      console.error('Error generating payment link:', error);
      return {
        success: false,
        message: 'Failed to generate payment link'
      };
    }
  }

  /**
   * Create a payment message for sharing
   */
  private static createPaymentMessage(
    product: Product, 
    totalAmount: number, 
    quantity: number,
    paymentUrl: string
  ): string {
    const itemText = quantity > 1 ? `${quantity}x ${product.name}` : product.name;
    const storeUrl = `${window.location.origin}/storefront/${product.userId}`;
    return `🛍️ *${itemText}*\n💰 Total: $${totalAmount.toFixed(2)}\n\n🔗 Pay instantly: ${paymentUrl}\n\n🏪 Visit store: ${storeUrl}\n\nClick the links to pay with M-Pesa or browse more products!`;
  }

  /**
   * Generate a visual thumbnail for the payment
   */
  private static async generateProductThumbnail(
    product: Product, 
    totalAmount: number, 
    quantity: number
  ): Promise<string | null> {
    try {
      // Create a temporary div for the thumbnail
      const thumbnailDiv = document.createElement('div');
      thumbnailDiv.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 400px;
        height: 300px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      thumbnailDiv.innerHTML = `
        <div style="display: flex; height: 100%; align-items: center; gap: 16px;">
          <div style="flex: 1;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">${product.name}</h2>
            <p style="margin: 0 0 16px 0; opacity: 0.9; font-size: 14px;">${product.description || 'Available now'}</p>
            <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 8px;">
              <div style="font-size: 18px; font-weight: bold;">
                ${quantity > 1 ? `${quantity}x ` : ''}$${totalAmount.toFixed(2)}
              </div>
              <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">
                Tap to pay with M-Pesa
              </div>
            </div>
          </div>
          ${product.imageUrl ? `
            <div style="width: 120px; height: 120px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.1);">
              <img src="${product.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
          ` : ''}
        </div>
      `;

      document.body.appendChild(thumbnailDiv);

      // Convert to canvas and get image data
      const canvas = await html2canvas(thumbnailDiv, {
        backgroundColor: null,
        scale: 2
      });

      document.body.removeChild(thumbnailDiv);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * Share payment link via WhatsApp with thumbnail
   */
  static async sharePaymentLink(
    product: Product, 
    paymentSettings: any,
    quantity: number = 1
  ): Promise<void> {
    try {
      const linkData = await this.generatePaymentLink(product, paymentSettings, quantity);
      
      if (linkData.success && linkData.link) {
        const message = this.createPaymentMessage(product, product.price * quantity, quantity, linkData.link);
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing payment link:', error);
    }
  }

  /**
   * Copy payment link to clipboard
   */
  static async copyPaymentLink(
    product: Product, 
    paymentSettings: any,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      const linkData = await this.generatePaymentLink(product, paymentSettings, quantity);
      
      if (linkData.success && linkData.link) {
        await navigator.clipboard.writeText(linkData.link);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error copying payment link:', error);
      return false;
    }
  }
}
