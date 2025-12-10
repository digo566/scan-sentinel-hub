-- Drop existing restrictive SELECT policies for partners
DROP POLICY IF EXISTS "Partners can view own profile" ON public.partners;
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partners;
DROP POLICY IF EXISTS "Master partners can view linked partners" ON public.partners;

-- Recreate as PERMISSIVE policies (default, any matching policy grants access)
CREATE POLICY "Partners can view own profile" 
ON public.partners 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners" 
ON public.partners 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Master partners can view linked partners" 
ON public.partners 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1 FROM master_partners mp 
  WHERE mp.user_id = auth.uid() AND mp.id = partners.master_partner_id
));