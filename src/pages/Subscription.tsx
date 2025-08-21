import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Crown, 
  Check, 
  X, 
  BarChart3, 
  Palette, 
  Globe, 
  MessageCircle,
  Zap,
  Phone,
  CreditCard
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionService, SubscriptionStatus } from '@/services/SubscriptionService';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  popular?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'KES',
    features: [
      'Up to 10 products',
      'Basic analytics',
      'Standard support',
      'KES currency only',
      'Basic themes'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 2000,
    currency: 'KES',
    popular: true,
    features: [
      'Unlimited products',
      'Advanced analytics',
      'Custom branding & themes',
      'Priority support',
      'Multi-currency support',
      'Custom business settings',
      'Advanced product sharing',
      'Store customization',
      'QR code generation',
      'Social media integration'
    ]
  }
];

export default function SubscriptionPage() {
  const [user] = useAuthState(auth);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user subscription status
  useEffect(() => {
    if (user?.uid) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      if (user?.uid) {
        const userSub = await SubscriptionService.getUserSubscription(user.uid);
        setSubscription(userSub);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade your subscription",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return;
    }

    // Basic phone validation
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/\+/g, '');
    if (!/^(07|01|254)/.test(cleanPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (07xxxxxxxx or 01xxxxxxxx)",
        variant: "destructive"
      });
      return;
    }

    setIsUpgrading(true);

    try {
      const result = await SubscriptionService.subscribeToPremium(
        user.uid,
        phoneNumber,
        user.email || ''
      );

      if (result.success) {
        toast({
          title: "STK Push Sent! 📱",
          description: "Complete the payment on your phone to activate premium subscription",
          duration: 10000
        });

        setShowPaymentForm(false);
        
        // Refresh subscription after a delay
        setTimeout(() => {
          loadSubscription();
        }, 5000);
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading subscription information...</div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.tier || 'free';
  const isPremium = currentPlan === 'premium' && subscription?.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Current Status */}
        {subscription && (
          <div className="mb-8 text-center">
            <Badge 
              variant={isPremium ? "default" : "secondary"} 
              className="mb-4"
            >
              {isPremium ? "Premium Active" : "Free Plan"}
            </Badge>
            {subscription.endDate && (
              <p className="text-sm text-gray-600">
                {isPremium ? `Expires: ${subscription.endDate.toLocaleDateString()}` : ''}
              </p>
            )}
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock powerful features to grow your business
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.popular 
                  ? 'ring-2 ring-blue-500 shadow-xl scale-105' 
                  : 'shadow-lg'
              } ${
                currentPlan === plan.id 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-white'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    <Crown className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {currentPlan === plan.id && (
                <div className="absolute -top-4 right-4">
                  <Badge className="bg-green-500 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.currency} {plan.price.toLocaleString()}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">/month</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => {
                    if (plan.id === 'premium' && currentPlan !== 'premium') {
                      setShowPaymentForm(true);
                    }
                  }}
                  disabled={currentPlan === plan.id}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } ${
                    currentPlan === plan.id
                      ? 'bg-green-600 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {currentPlan === plan.id 
                    ? 'Current Plan' 
                    : plan.price === 0 
                      ? 'Current Plan' 
                      : 'Upgrade Now'
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Upgrade to Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">M-Pesa Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07XXXXXXXX or 01XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter your Safaricom number for M-Pesa payment
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">Payment: KES 2,000/month</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    You'll receive an STK push to complete payment
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1"
                    disabled={isUpgrading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpgrade}
                    disabled={isUpgrading || !phoneNumber.trim()}
                    className="flex-1"
                  >
                    {isUpgrading ? 'Processing...' : 'Pay Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Premium Features Preview
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 text-sm">
                Detailed insights into your sales, customers, and revenue trends
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Palette className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Custom Branding</h3>
              <p className="text-gray-600 text-sm">
                Upload your logo, customize colors, and create a unique brand experience
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Globe className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Multi-Currency</h3>
              <p className="text-gray-600 text-sm">
                Accept payments in USD, EUR, GBP and other major currencies
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
