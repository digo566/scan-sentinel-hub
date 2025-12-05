-- Revogar acesso público à tabela profiles
REVOKE SELECT ON public.profiles FROM anon;

-- Revogar acesso público à tabela submissions
REVOKE SELECT ON public.submissions FROM anon;

-- Garantir que apenas authenticated pode acessar
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.submissions TO authenticated;