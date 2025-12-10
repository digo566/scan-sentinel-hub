-- Criar função pública para validar cupom de master partner
CREATE OR REPLACE FUNCTION public.validate_master_coupon(coupon text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.master_partners 
    WHERE LOWER(coupon_code) = LOWER(coupon)
  )
$$;