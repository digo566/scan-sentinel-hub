-- Tabela para códigos de recuperação de senha
CREATE TABLE public.password_recovery_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca por email e código
CREATE INDEX idx_recovery_codes_email ON public.password_recovery_codes(email);
CREATE INDEX idx_recovery_codes_code ON public.password_recovery_codes(code);

-- Enable RLS
ALTER TABLE public.password_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Políticas: ninguém pode acessar diretamente via API (apenas edge functions com service role)
CREATE POLICY "No direct access to recovery codes"
ON public.password_recovery_codes
FOR ALL
USING (false);

-- Função para invalidar códigos antigos do mesmo email
CREATE OR REPLACE FUNCTION public.invalidate_old_recovery_codes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.password_recovery_codes
  SET used = true
  WHERE email = NEW.email
    AND id != NEW.id
    AND used = false;
  RETURN NEW;
END;
$$;

-- Trigger para invalidar códigos antigos quando um novo é criado
CREATE TRIGGER invalidate_old_codes
  AFTER INSERT ON public.password_recovery_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_old_recovery_codes();