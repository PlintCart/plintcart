import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: any[];
  max_products: number | null;
  is_active: boolean;
}

interface UserSubscription {
  plan_name: string;
  status: string;
  max_products: number | null;
  features: any[];
  expires_at: string | null;
}

export function useSubscription(user: User | null) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPremium = subscription?.plan_name === 'Professional' && subscription?.status === 'active';
  const isExpired = subscription?.expires_at ? new Date(subscription.expires_at) < new Date() : false;

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchUserSubscription();
  }, [user]);

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_subscription', {
        user_uuid: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const subscriptionData = data[0];
        setSubscription({
          ...subscriptionData,
          features: Array.isArray(subscriptionData.features) ? subscriptionData.features : []
        });
      } else {
        // Default to free plan
        setSubscription({
          plan_name: 'Free',
          status: 'active',
          max_products: 50,
          features: ['Up to 50 products', 'WhatsApp integration', 'Basic analytics', 'Mobile responsive', 'Product sharing', 'Email support'],
          expires_at: null
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const checkProductLimit = async (): Promise<{ allowed: boolean; currentCount: number; limit: number | null }> => {
    if (!user) return { allowed: false, currentCount: 0, limit: null };

    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;

      const currentCount = count || 0;
      const limit = subscription?.max_products;

      return {
        allowed: limit === null || currentCount < limit,
        currentCount,
        limit
      };
    } catch (err) {
      console.error('Error checking product limit:', err);
      return { allowed: false, currentCount: 0, limit: subscription?.max_products || null };
    }
  };

  return {
    subscription,
    loading,
    error,
    isPremium,
    isExpired,
    checkProductLimit,
    refreshSubscription: fetchUserSubscription
  };
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(plan => ({
    ...plan,
    features: Array.isArray(plan.features) ? plan.features : []
  }));
}