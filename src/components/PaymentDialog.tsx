import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Phone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MpesaService, PaymentRequest, MpesaSettings } from "@/services/MpesaService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PaymentDialogProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

interface StoredPaymentSettings {
  // Direct settings format (as stored by AdminSettings)
  enableMpesa?: boolean;
  mpesaMethod?: 'paybill' | 'till' | 'send_money';
  paybillNumber?: string;
  accountReference?: string;
  tillNumber?: string;
  mpesaPhoneNumber?: string;
  mpesaInstructions?: string;
  
  // Legacy nested format (for backward compatibility)
  mpesa?: {
    enabled: boolean;
    method: 'paybill' | 'till' | 'send_money';
    paybillNumber?: string;
    accountNumber?: string;
    tillNumber?: string;
    phoneNumber?: string;
  };
}

export const PaymentDialog = ({ product, isOpen, onClose }: PaymentDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<StoredPaymentSettings | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const totalAmount = product.price * quantity;

  // Load payment settings when dialog opens
  useEffect(() => {
    if (isOpen && product.userId) {
      loadPaymentSettings();
    }
  }, [isOpen, product.userId]);

  const loadPaymentSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", product.userId));
      if (settingsDoc.exists()) {
        setPaymentSettings(settingsDoc.data() as StoredPaymentSettings);
      } else {
        // Set default empty settings if none exist
        setPaymentSettings({ enableMpesa: false, mpesaMethod: 'paybill' });
      }
    } catch (error) {
      console.error("Error loading payment settings:", error);
      // Set default settings on error
      setPaymentSettings({ enableMpesa: false, mpesaMethod: 'paybill' });
    }
  };

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }

    // Check if M-Pesa is enabled - support both formats
    const isMpesaEnabled = paymentSettings?.enableMpesa || paymentSettings?.mpesa?.enabled;
    
    if (!isMpesaEnabled) {
      toast({
        title: "Payment not available",
        description: "M-Pesa payments are not configured for this merchant",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Convert stored settings to MpesaSettings format - support both formats
      const mpesaSettings: MpesaSettings = {
        enableMpesa: paymentSettings?.enableMpesa || paymentSettings?.mpesa?.enabled || false,
        mpesaMethod: paymentSettings?.mpesaMethod || paymentSettings?.mpesa?.method || 'paybill',
        paybillNumber: paymentSettings?.paybillNumber || paymentSettings?.mpesa?.paybillNumber,
        accountReference: paymentSettings?.accountReference || paymentSettings?.mpesa?.accountNumber,
        tillNumber: paymentSettings?.tillNumber || paymentSettings?.mpesa?.tillNumber,
        mpesaPhoneNumber: paymentSettings?.mpesaPhoneNumber || paymentSettings?.mpesa?.phoneNumber,
        mpesaInstructions: paymentSettings?.mpesaInstructions,
      };
      
      const paymentRequest: PaymentRequest = {
        phoneNumber: phoneNumber.trim(),
        amount: totalAmount,
        orderId,
        description: `Payment for ${quantity}x ${product.name}`,
        merchantSettings: mpesaSettings
      };

      const response = await MpesaService.initiatePayment(paymentRequest);

      if (response.success) {
        toast({
          title: "Payment Initiated",
          description: "Please check your phone for the M-Pesa prompt",
        });
        
        // Show payment status
        if (response.instructions) {
          toast({
            title: "Payment Instructions",
            description: response.instructions,
          });
        }
        
        // Close dialog after successful initiation
        setTimeout(() => {
          onClose();
          setPhoneNumber("");
          setQuantity(1);
        }, 2000);
      } else {
        throw new Error(response.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as Kenyan number (254...)
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      return '254' + cleaned;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay for {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs text-gray-500">No image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">
                ${product.price.toFixed(2)} each
              </p>
              <Badge variant="outline" className="mt-1">
                {product.category}
              </Badge>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
                min="1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              M-Pesa Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="254712345678"
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={isProcessing}
            />
            <p className="text-xs text-muted-foreground">
              Enter your Safaricom number (format: 254712345678)
            </p>
          </div>

          {/* Payment Method Info */}
          {(paymentSettings?.enableMpesa || paymentSettings?.mpesa?.enabled) ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">M-Pesa Payment Available</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You will receive an STK push notification on your phone
              </p>
              <p className="text-xs text-green-600 mt-1">
                Method: {(paymentSettings?.mpesaMethod || paymentSettings?.mpesa?.method || 'paybill').replace('_', ' ').toUpperCase()}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <CreditCard className="h-4 w-4" />
                <span className="font-medium">Payment Configuration Needed</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This merchant hasn't configured M-Pesa payments yet. You can still order via WhatsApp.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!phoneNumber.trim() || isProcessing || !(paymentSettings?.enableMpesa || paymentSettings?.mpesa?.enabled)}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
