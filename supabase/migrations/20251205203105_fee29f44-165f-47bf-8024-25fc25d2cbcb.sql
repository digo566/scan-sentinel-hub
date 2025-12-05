-- Remover política antiga que permite submissões anônimas
DROP POLICY IF EXISTS "Anyone can submit" ON public.submissions;

-- Criar política que exige autenticação para submissões
CREATE POLICY "Authenticated users can submit"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Bloquear INSERT no user_roles (roles são atribuídos via trigger)
CREATE POLICY "No direct role inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Bloquear UPDATE no user_roles
CREATE POLICY "No direct role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false);

-- Bloquear DELETE no user_roles
CREATE POLICY "No direct role deletes"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);

-- Admins podem deletar perfis
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));