-- First, let's update the users table to use UUID as the primary key to match auth.users
ALTER TABLE public.users DROP CONSTRAINT users_pkey;
ALTER TABLE public.users DROP COLUMN id;
ALTER TABLE public.users ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Now create proper RLS policies for users table
CREATE POLICY "Users can view their own record" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);