import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';
import { SubscriptionUpgradeDialog } from './SubscriptionUpgradeDialog';

import { User } from 'firebase/auth';

interface PremiumWrapperProps {
  children: React.ReactNode;
  user: User | null;
  feature: string;
  fallbackContent?: React.ReactNode;
  showUpgrade?: boolean;
}

export function PremiumWrapper({ 
  children, 
  user, 
  feature, 
  fallbackContent, 
  showUpgrade = true 
}: PremiumWrapperProps) {
  const { isPremium, loading } = useSubscription(user);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            Sign In Required
          </CardTitle>
          <CardDescription>
            Please sign in to access {feature}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallbackContent) {
    return <>{fallbackContent}</>;
  }

  return (
    <Card className="border-dashed border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-amber-800">
          <Crown className="h-5 w-5" />
          Premium Feature
        </CardTitle>
        <CardDescription className="text-amber-700">
          {user && <SubscriptionUpgradeDialog user={user} />}
        </CardDescription>
      </CardHeader>
      {showUpgrade && user && (
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
            <Zap className="h-4 w-4" />
            <span>Unlock unlimited products, advanced analytics, and more!</span>
          </div>
          <SubscriptionUpgradeDialog user={user} />
        </CardContent>
      )}
    </Card>
  );
}

interface PremiumBadgeProps {
  user: User | null;
  className?: string;
}

export function PremiumBadge({ user, className }: PremiumBadgeProps) {
  const { subscription, isPremium, loading } = useSubscription(user);

  if (loading || !user) return null;

  return (
    <Badge 
      variant={isPremium ? "default" : "secondary"} 
      className={className}
    >
      {isPremium ? (
        <>
          <Crown className="h-3 w-3 mr-1" />
          Professional
        </>
      ) : (
        <>
          Free Plan
        </>
      )}
    </Badge>
  );
}