import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, Check, Smartphone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionUpgradeDialogProps {
  user: User;
}

export function SubscriptionUpgradeDialog({ user }: SubscriptionUpgradeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { toast } = useToast();

  const professionalFeatures = [
    'Unlimited products',
    'Advanced analytics',
    'Custom branding & themes',
    'Priority support',
    'Multi-currency support',
    'Custom business settings',
    'Advanced product sharing',
    'Store customization'
  ];

  const handleUpgrade = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setPaymentStatus('pending');

    try {
      // Get the professional plan ID
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Professional')
        .single();

      if (planError || !planData) {
        throw new Error('Professional plan not found');
      }

      // Call the payment processing edge function
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          phoneNumber: formattedPhone,
          amount: 2500,
          userId: user.id,
          planId: planData.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setPaymentId(data.paymentId);
        toast({
          title: "Payment initiated",
          description: "Please complete the payment on your phone",
        });

        // Start polling for payment status
        pollPaymentStatus(data.paymentId);
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : 'Failed to initiate payment',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: { paymentId }
        });

        if (error) throw error;

        if (data.payment.payment_status === 'completed') {
          setPaymentStatus('completed');
          toast({
            title: "Payment successful!",
            description: "Your account has been upgraded to Professional",
          });
          
          // Close dialog after a brief delay
          setTimeout(() => {
            setIsOpen(false);
            window.location.reload(); // Refresh to update subscription status
          }, 2000);
          return;
        }

        if (data.payment.payment_status === 'failed') {
          setPaymentStatus('failed');
          toast({
            title: "Payment failed",
            description: "Please try again or contact support",
            variant: "destructive"
          });
          return;
        }

        // Continue polling if still pending
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setPaymentStatus('failed');
          toast({
            title: "Payment timeout",
            description: "Payment is taking longer than expected. Please check your M-Pesa messages.",
            variant: "destructive"
          });
        }

      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const formatPhoneNumber = (phone: string): string | null => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('254') && cleanPhone.length === 12) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      return '254' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 9) {
      return '254' + cleanPhone;
    }
    
    return null;
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) {
      setPhoneNumber('');
      return;
    }
    
    if (digits.startsWith('254')) {
      setPhoneNumber(digits.slice(0, 12));
    } else if (digits.startsWith('0')) {
      setPhoneNumber(digits.slice(0, 10));
    } else {
      setPhoneNumber('0' + digits.slice(0, 9));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Professional
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Upgrade to Professional
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Professional Plan</CardTitle>
                <Badge variant="secondary">Most Popular</Badge>
              </div>
              <CardDescription className="text-2xl font-bold text-primary">
                KSh 2,500<span className="text-sm font-normal text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2">
                {professionalFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {paymentStatus === 'idle' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your Safaricom number for M-Pesa payment
                </p>
              </div>

              <Button 
                onClick={handleUpgrade}
                disabled={!phoneNumber || loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initiating Payment...
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Pay KSh 2,500 with M-Pesa
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Payment Status */}
          {paymentStatus !== 'idle' && (
            <Alert>
              <AlertDescription>
                {paymentStatus === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Payment initiated. Please check your phone for the M-Pesa prompt and complete the payment.
                  </div>
                )}
                {paymentStatus === 'completed' && (
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-4 h-4" />
                    Payment successful! Your account has been upgraded.
                  </div>
                )}
                {paymentStatus === 'failed' && (
                  <div className="text-red-700">
                    Payment failed. Please try again or contact support.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}