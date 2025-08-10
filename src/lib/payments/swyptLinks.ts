// Swypt Payment Integration for individual product links
// Documentation: https://docs.swypt.io
export interface SwyptPaymentLink {
  productId: string;
  productName: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

export class SwyptPaymentService {
  private apiKey = import.meta.env.VITE_SWYPT_API_KEY;
  private businessId = import.meta.env.VITE_SWYPT_BUSINESS_ID;
  private isProduction = import.meta.env.VITE_SWYPT_ENV === 'production';

  // Official Swypt.io checkout URL
  private checkoutUrl = this.isProduction 
    ? 'https://checkout.swypt.io'
    : 'https://sandbox-checkout.swypt.io';

  generatePaymentLink(payment: SwyptPaymentLink): string {
    // Create official Swypt.io payment parameters
    const swyptParams: Record<string, any> = {
      // Required Swypt parameters
      business_id: this.businessId || 'your_business_id',
      amount: payment.price,
      currency: 'KES',
      reference: `PRODUCT-${payment.productId}-${Date.now()}`,
      description: payment.description || `Payment for ${payment.productName}`,
      
      // Product metadata
      product_name: payment.productName,
      product_id: payment.productId,
      
      // Success/Cancel URLs (adjust to your domain)
      success_url: `${window.location.origin}/payment-success?product=${payment.productId}`,
      cancel_url: `${window.location.origin}/payment-cancelled?product=${payment.productId}`,
      
      // Optional: Customer can return to product page
      return_url: `${window.location.origin}/product/${payment.productId}`,
    };

    // Add API key if available
    if (this.apiKey && this.apiKey !== 'your_swypt_api_key_here') {
      swyptParams.api_key = this.apiKey;
    }

    // Convert to URL parameters
    const params = new URLSearchParams();
    Object.entries(swyptParams).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    // Return official Swypt checkout link
    return `${this.checkoutUrl}?${params.toString()}`;
  }

  async createPaymentLink(payment: SwyptPaymentLink): Promise<string> {
    try {
      // If you have Swypt API access, create payment via API
      if (this.apiKey && this.apiKey !== 'your_swypt_api_key_here') {
        const response = await fetch('https://api.swypt.io/v1/payment-links', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_id: this.businessId,
            amount: payment.price,
            currency: 'KES',
            description: payment.description || `Payment for ${payment.productName}`,
            reference: `PRODUCT-${payment.productId}-${Date.now()}`,
            metadata: {
              product_id: payment.productId,
              product_name: payment.productName
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          return result.checkout_url || result.payment_url;
        }
      }

      // Fallback to direct checkout link
      return this.generatePaymentLink(payment);
      
    } catch (error) {
      console.error('Error creating Swypt payment link:', error);
      // Fallback to direct checkout link
      return this.generatePaymentLink(payment);
    }
  }
}

export const swyptPayment = new SwyptPaymentService();
