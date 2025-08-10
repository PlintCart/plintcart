import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, CreditCard } from 'lucide-react';
import { swyptPayment } from '@/lib/payments/swyptLinks';
import { toast } from 'sonner';

interface SwyptPaymentButtonProps {
  productId: string;
  productName: string;
  price: number;
  description?: string;
  imageUrl?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SwyptPaymentButton({
  productId,
  productName,
  price,
  description,
  imageUrl,
  className = '',
  variant = 'default',
  size = 'default'
}: SwyptPaymentButtonProps) {
  
  const handleSwyptPayment = () => {
    try {
      const paymentLink = swyptPayment.generatePaymentLink({
        productId,
        productName,
        price,
        description,
        imageUrl
      });

      // Open Swypt payment link in new tab
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
      
      toast.success('Redirecting to Swypt for payment...');
      
      // Track the payment attempt
      console.log('Swypt payment initiated:', {
        productId,
        productName,
        price,
        paymentLink
      });
      
    } catch (error) {
      console.error('Error creating Swypt payment link:', error);
      toast.error('Failed to create payment link. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleSwyptPayment}
      variant={variant}
      size={size}
      className={`${className} bg-blue-600 hover:bg-blue-700 text-white`}
    >
      <CreditCard className="w-4 h-4 mr-2" />
      Pay KES {price.toLocaleString()} via Swypt
      <ExternalLink className="w-4 h-4 ml-2" />
    </Button>
  );
}

export default SwyptPaymentButton;
