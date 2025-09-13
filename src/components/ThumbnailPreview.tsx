import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Download, Share2 } from 'lucide-react';
import { ProductThumbnailGenerator } from '@/lib/productThumbnailGenerator';
import { ProductSharingService } from '@/lib/productSharing';
import { Product } from '@/types/product';
import { toast } from 'sonner';

interface ThumbnailPreviewProps {
  product: Product;
  settings: any;
}

export function ThumbnailPreview({ product, settings }: ThumbnailPreviewProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generatePreview = async () => {
    if (thumbnailUrl) return; // Already generated

    setIsGenerating(true);
    try {
      const dataUrl = await ProductThumbnailGenerator.generateProductThumbnail(product, {
        businessName: settings.businessName,
        currency: settings.currency,
        primaryColor: settings.primaryColor,
        storeTheme: settings.storeTheme
      });
      setThumbnailUrl(dataUrl);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      toast.error('Failed to generate thumbnail preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadThumbnail = () => {
    if (!thumbnailUrl) return;
    ProductSharingService.downloadThumbnail(thumbnailUrl, product.name);
    toast.success('Thumbnail downloaded!');
  };

  const shareThumbnail = async () => {
    try {
      const result = await ProductSharingService.shareProductThumbnail(product, settings);
      if (result.success) {
        toast.success(result.message || 'Thumbnail shared successfully!');
        setIsOpen(false);
      } else {
        toast.error('Failed to share thumbnail');
      }
    } catch (error) {
      console.error('Error sharing thumbnail:', error);
      toast.error('Failed to share thumbnail');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto"
          onClick={() => {
            setIsOpen(true);
            generatePreview();
          }}
        >
          <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Preview</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md mx-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Thumbnail Preview</DialogTitle>
          <DialogDescription>
            This is how your product will appear when shared as a thumbnail.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          
          <div className="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[300px]">
            {isGenerating ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Generating thumbnail...</span>
              </div>
            ) : thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={`${product.name} thumbnail`}
                className="max-w-full max-h-[400px] object-contain"
              />
            ) : (
              <div className="text-muted-foreground">Click to generate preview</div>
            )}
          </div>
          
          {thumbnailUrl && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                className="flex-1 w-full sm:w-auto"
                onClick={downloadThumbnail}
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Download</span>
              </Button>
              <Button 
                className="flex-1 w-full sm:w-auto"
                onClick={shareThumbnail}
              >
                <Share2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Share Now</span>
              </Button>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
            💡 <strong>Tip:</strong> The thumbnail includes your product image, price, business name, and branding. 
            When shared, people can click it to visit your store and make a purchase!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
