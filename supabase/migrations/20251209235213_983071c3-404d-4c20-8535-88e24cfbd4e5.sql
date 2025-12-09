-- Criar enum para status de pagamento de afiliado
CREATE TYPE public.affiliate_payment_status AS ENUM ('pending', 'paid');

-- Tabela de parceiros master
CREATE TABLE public.master_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  coupon_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de uso de cupons de parceiros
CREATE TABLE public.partner_coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.master_partners(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  payment_value NUMERIC(10,2) NOT NULL DEFAULT 20.00,
  commission_value NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  payment_status affiliate_payment_status NOT NULL DEFAULT 'pending',
  payment_receipt_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para controlar se cadastro de master está habilitado
CREATE TABLE public.master_registration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração inicial
INSERT INTO public.master_registration_settings (registration_enabled) VALUES (true);

-- Habilitar RLS
ALTER TABLE public.master_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_registration_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para master_partners
CREATE POLICY "Partners can view own profile"
ON public.master_partners
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Partners can update own profile"
ON public.master_partners
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners"
ON public.master_partners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partners"
ON public.master_partners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir inserção via service role (edge function)
CREATE POLICY "Service role can insert partners"
ON public.master_partners
FOR INSERT
WITH CHECK (true);

-- Políticas RLS para partner_coupon_usage
CREATE POLICY "Partners can view own usage"
ON public.partner_coupon_usage
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.master_partners
    WHERE master_partners.id = partner_coupon_usage.partner_id
    AND master_partners.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all usage"
ON public.partner_coupon_usage
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update usage"
ON public.partner_coupon_usage
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert usage"
ON public.partner_coupon_usage
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para master_registration_settings
CREATE POLICY "Anyone can read settings"
ON public.master_registration_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update settings"
ON public.master_registration_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_master_partners_updated_at
BEFORE UPDATE ON public.master_partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_registration_settings_updated_at
BEFORE UPDATE ON public.master_registration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar role master_partner
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master_partner';

-- Função para verificar se cupom de parceiro existe
CREATE OR REPLACE FUNCTION public.get_partner_discount(coupon_code TEXT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.master_partners WHERE master_partners.coupon_code = get_partner_discount.coupon_code)
    THEN 5.00
    ELSE 0.00
  END
$$;