import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Smartphone, MessageCircle, Copy } from 'lucide-react';

interface SharingInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SharingInstructions({ isOpen, onClose }: SharingInstructionsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            How Product Sharing Works
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              What happens when you share:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Product thumbnail image is prepared</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Message with product details and store links is created</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                <span>Both are copied to your clipboard or shared directly</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Smartphone className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">On Mobile</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sharing dialog opens with image and message ready to send
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Copy className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">On Desktop</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Image and message copied to clipboard - paste in any chat
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">WhatsApp Integration</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Opens WhatsApp with pre-filled message and product links
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              📱 Best Practices:
            </h3>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>• Share the image first, then the text message</li>
              <li>• Both product link and store link are included</li>
              <li>• Customers can view the product or browse your full store</li>
            </ul>
          </div>

          <Button onClick={onClose} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
