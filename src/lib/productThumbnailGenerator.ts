import { Product } from '@/types/product';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  businessName?: string;
  currency?: string;
  primaryColor?: string;
  storeTheme?: string;
}

export class ProductThumbnailGenerator {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  // Initialize canvas for thumbnail generation
  private static initCanvas(width: number = 400, height: number = 600): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // Generate a product thumbnail as a data URL
  static async generateProductThumbnail(
    product: Product, 
    options: ThumbnailOptions = {}
  ): Promise<string> {
    const {
      width = 400,
      height = 600,
      businessName = 'Store',
      currency = 'usd',
      primaryColor = '#059669',
      storeTheme = 'modern'
    } = options;

    this.initCanvas(width, height);
    if (!this.ctx || !this.canvas) {
      throw new Error('Canvas not supported');
    }

    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get theme colors
    const themeColors = this.getThemeColors(storeTheme, primaryColor);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, themeColors.background1);
    gradient.addColorStop(1, themeColors.background2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    try {
      // Load and draw product image
      if (product.imageUrl) {
        const img = await this.loadImage(product.imageUrl);
        const imageHeight = 250;
        const imageWidth = width - 40;
        const imageX = 20;
        const imageY = 20;
        
        // Draw rounded rectangle for image
        this.drawRoundedRect(ctx, imageX, imageY, imageWidth, imageHeight, 12);
        ctx.clip();
        
        // Calculate aspect ratio and draw image
        const aspectRatio = img.width / img.height;
        let drawWidth = imageWidth;
        let drawHeight = imageHeight;
        let drawX = imageX;
        let drawY = imageY;
        
        if (aspectRatio > imageWidth / imageHeight) {
          drawHeight = imageWidth / aspectRatio;
          drawY = imageY + (imageHeight - drawHeight) / 2;
        } else {
          drawWidth = imageHeight * aspectRatio;
          drawX = imageX + (imageWidth - drawWidth) / 2;
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Reset clipping
        ctx.restore();
        ctx.save();
      } else {
        // Draw placeholder if no image
        this.drawPlaceholder(ctx, 20, 20, width - 40, 250, themeColors.placeholder);
      }

      // Draw price badge
      this.drawPriceBadge(ctx, product, currency, primaryColor, width - 100, 30);

      // Draw product info
      this.drawProductInfo(ctx, product, businessName, themeColors, 20, 290, width - 40);

      // Draw footer
      this.drawFooter(ctx, businessName, primaryColor, 20, height - 80, width - 40);

    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Draw error state
      this.drawErrorState(ctx, width, height, themeColors);
    }

    return this.canvas.toDataURL('image/png', 0.9);
  }

  // Load image with promise
  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Draw rounded rectangle
  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Draw price badge
  private static drawPriceBadge(
    ctx: CanvasRenderingContext2D,
    product: Product,
    currency: string,
    primaryColor: string,
    x: number,
    y: number
  ): void {
    const currencySymbol = this.getCurrencySymbol(currency);
    const priceText = `${currencySymbol}${product.price}`;
    
    ctx.save();
    ctx.font = 'bold 18px Arial, sans-serif';
    const textWidth = ctx.measureText(priceText).width;
    const badgeWidth = textWidth + 20;
    const badgeHeight = 36;
    
    // Draw badge background
    ctx.fillStyle = primaryColor;
    this.drawRoundedRect(ctx, x - badgeWidth, y, badgeWidth, badgeHeight, 18);
    ctx.fill();
    
    // Draw price text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(priceText, x - badgeWidth/2, y + badgeHeight/2);
    ctx.restore();
  }

  // Draw product information
  private static drawProductInfo(
    ctx: CanvasRenderingContext2D,
    product: Product,
    businessName: string,
    themeColors: any,
    x: number,
    y: number,
    width: number
  ): void {
    ctx.save();
    
    // Product name
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = themeColors.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const nameLines = this.wrapText(ctx, product.name, width, 24);
    let currentY = y;
    
    nameLines.forEach(line => {
      ctx.fillText(line, x, currentY);
      currentY += 30;
    });
    
    currentY += 10;
    
    // Product description
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = themeColors.textMuted;
    
    const descLines = this.wrapText(ctx, product.description, width, 16);
    const maxDescLines = 3;
    
    descLines.slice(0, maxDescLines).forEach((line, index) => {
      if (index === maxDescLines - 1 && descLines.length > maxDescLines) {
        ctx.fillText(line + '...', x, currentY);
      } else {
        ctx.fillText(line, x, currentY);
      }
      currentY += 22;
    });
    
    currentY += 20;
    
    // Category badge
    if (product.category) {
      ctx.font = 'bold 14px Arial, sans-serif';
      const categoryText = product.category.toUpperCase();
      const categoryWidth = ctx.measureText(categoryText).width + 16;
      
      ctx.fillStyle = themeColors.accent;
      this.drawRoundedRect(ctx, x, currentY, categoryWidth, 28, 14);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(categoryText, x + categoryWidth/2, currentY + 14);
    }
    
    ctx.restore();
  }

  // Draw footer with business info
  private static drawFooter(
    ctx: CanvasRenderingContext2D,
    businessName: string,
    primaryColor: string,
    x: number,
    y: number,
    width: number
  ): void {
    ctx.save();
    
    // Draw separator line
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    
    // Business name
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`🏪 ${businessName}`, x, y + 15);
    
    // Powered by Plint
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'right';
    ctx.fillText('Powered by Plint', x + width, y + 50);
    
    ctx.restore();
  }

  // Draw placeholder for missing image
  private static drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    ctx.save();
    ctx.fillStyle = color;
    this.drawRoundedRect(ctx, x, y, width, height, 12);
    ctx.fill();
    
    // Draw icon
    ctx.fillStyle = '#999';
    ctx.font = '48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛍️', x + width/2, y + height/2 - 20);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Product Image', x + width/2, y + height/2 + 30);
    ctx.restore();
  }

  // Draw error state
  private static drawErrorState(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeColors: any
  ): void {
    ctx.save();
    ctx.fillStyle = themeColors.background1;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = themeColors.text;
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Product Thumbnail', width/2, height/2 - 20);
    
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = themeColors.textMuted;
    ctx.fillText('Unable to load image', width/2, height/2 + 20);
    ctx.restore();
  }

  // Wrap text to fit within specified width
  private static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  // Get theme colors
  private static getThemeColors(theme: string, primaryColor: string) {
    switch (theme) {
      case 'elegant':
        return {
          background1: '#f8fafc',
          background2: '#e2e8f0',
          text: '#1e293b',
          textMuted: '#64748b',
          accent: primaryColor,
          placeholder: '#f1f5f9'
        };
      case 'vibrant':
        return {
          background1: '#fdf4ff',
          background2: '#f3e8ff',
          text: '#581c87',
          textMuted: '#7c3aed',
          accent: primaryColor,
          placeholder: '#ede9fe'
        };
      case 'classic':
        return {
          background1: '#f9fafb',
          background2: '#e5e7eb',
          text: '#111827',
          textMuted: '#6b7280',
          accent: primaryColor,
          placeholder: '#f3f4f6'
        };
      default: // modern
        return {
          background1: '#ffffff',
          background2: '#f0f9ff',
          text: '#0f172a',
          textMuted: '#475569',
          accent: primaryColor,
          placeholder: '#f1f5f9'
        };
    }
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

  // Convert canvas to blob for sharing
  static async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', 0.9);
    });
  }
}
