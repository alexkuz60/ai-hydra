-- Allow supervisors to view all profiles (needed for admin panel user management)
CREATE POLICY "Supervisors can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'supervisor'::app_role));
