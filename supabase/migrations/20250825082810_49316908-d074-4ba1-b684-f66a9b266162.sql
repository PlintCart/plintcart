-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_products INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price, currency, features, max_products) VALUES
('Free', 0, 'KES', '["Up to 50 products", "WhatsApp integration", "Basic analytics", "Mobile responsive", "Product sharing", "Email support"]'::jsonb, 50),
('Professional', 2500, 'KES', '["Unlimited products", "Advanced analytics", "Custom branding & themes", "Priority support", "Multi-currency support", "Custom business settings", "Advanced product sharing", "Store customization"]'::jsonb, NULL);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')) DEFAULT 'inactive',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT DEFAULT 'mpesa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL DEFAULT 'mpesa',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  checkout_request_id TEXT,
  mpesa_receipt_number TEXT,
  phone_number TEXT,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user's current subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  plan_name TEXT,
  status TEXT,
  max_products INTEGER,
  features JSONB,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    sp.name as plan_name,
    COALESCE(us.status, 'inactive') as status,
    sp.max_products,
    sp.features,
    us.expires_at
  FROM public.subscription_plans sp
  LEFT JOIN public.user_subscriptions us ON sp.id = us.plan_id AND us.user_id = user_uuid
  WHERE sp.name = 'Free' OR (us.user_id = user_uuid AND us.status = 'active')
  ORDER BY sp.price DESC
  LIMIT 1;
$$;