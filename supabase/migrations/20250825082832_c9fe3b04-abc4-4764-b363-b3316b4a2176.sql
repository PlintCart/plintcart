-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

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
SET search_path = public
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