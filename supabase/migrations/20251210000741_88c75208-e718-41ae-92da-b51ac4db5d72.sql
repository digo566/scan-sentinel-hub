-- Tabela de parceiros (diferente de master_partners)
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  pix_key TEXT NOT NULL,
  coupon_code TEXT NOT NULL UNIQUE,
  master_partner_id UUID REFERENCES public.master_partners(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para partners
CREATE POLICY "Admins can view all partners"
ON public.partners FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own profile"
ON public.partners FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Partners can update own profile"
ON public.partners FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert partners"
ON public.partners FOR INSERT
WITH CHECK (true);

-- Tabela de vendas/uso de cupons de parceiros
CREATE TABLE public.partner_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id),
  submission_id UUID NOT NULL REFERENCES public.submissions(id),
  sale_value NUMERIC NOT NULL DEFAULT 20.00,
  commission_value NUMERIC NOT NULL DEFAULT 5.00,
  master_commission_value NUMERIC NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_receipt_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.partner_sales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para partner_sales
CREATE POLICY "Admins can view all sales"
ON public.partner_sales FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales"
ON public.partner_sales FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sales"
ON public.partner_sales FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own sales"
ON public.partner_sales FOR SELECT
USING (EXISTS (
  SELECT 1 FROM partners 
  WHERE partners.id = partner_sales.partner_id 
  AND partners.user_id = auth.uid()
));

-- Configurações de registro de parceiros
CREATE TABLE public.partner_registration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_enabled BOOLEAN NOT NULL DEFAULT true,
  registration_price NUMERIC NOT NULL DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração inicial
INSERT INTO public.partner_registration_settings (registration_enabled) VALUES (true);

-- Habilitar RLS
ALTER TABLE public.partner_registration_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can read partner settings"
ON public.partner_registration_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update partner settings"
ON public.partner_registration_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Função para verificar desconto de parceiro (atualizada)
CREATE OR REPLACE FUNCTION public.get_partner_discount(coupon_code text)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    -- Cupom de master partner = 5 reais
    WHEN EXISTS (SELECT 1 FROM public.master_partners WHERE master_partners.coupon_code = get_partner_discount.coupon_code)
    THEN 5.00
    -- Cupom de partner = 5 reais
    WHEN EXISTS (SELECT 1 FROM public.partners WHERE partners.coupon_code = get_partner_discount.coupon_code)
    THEN 5.00
    ELSE 0.00
  END
$$;

-- Triggers para updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_registration_settings_updated_at
BEFORE UPDATE ON public.partner_registration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();