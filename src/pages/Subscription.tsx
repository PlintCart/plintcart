import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  X, 
  BarChart3, 
  Palette, 
  Globe, 
  MessageCircle,
  Zap
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSubscription = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentPlan(userData.subscriptionTier || 'free');
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }
      }
      setLoading(false);
    };

    fetchUserSubscription();
  }, [user]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'premium') {
      // Initiate M-Pesa payment for subscription
      // This will integrate with your existing M-Pesa system
      console.log('Initiating premium subscription payment...');
      
      // TODO: Integrate with MpesaService for subscription payment
      // Amount: KES 2,000 for premium plan
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
                  onClick={() => handleUpgrade(plan.id)}
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
