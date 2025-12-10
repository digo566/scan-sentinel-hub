-- Update get_partner_discount function to be case-insensitive
CREATE OR REPLACE FUNCTION public.get_partner_discount(coupon_code text)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    -- Cupom de master partner = 5 reais
    WHEN EXISTS (SELECT 1 FROM public.master_partners WHERE LOWER(master_partners.coupon_code) = LOWER(get_partner_discount.coupon_code))
    THEN 5.00
    -- Cupom de partner = 5 reais
    WHEN EXISTS (SELECT 1 FROM public.partners WHERE LOWER(partners.coupon_code) = LOWER(get_partner_discount.coupon_code))
    THEN 5.00
    ELSE 0.00
  END
$function$;