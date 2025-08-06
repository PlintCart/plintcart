-- Create RLS policies for users table to fix security warning
CREATE POLICY "Users can view their own record" 
ON public.users 
FOR SELECT 
USING (auth.uid()::bigint = id);

CREATE POLICY "Users can update their own record" 
ON public.users 
FOR UPDATE 
USING (auth.uid()::bigint = id);

CREATE POLICY "Users can insert their own record" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid()::bigint = id);