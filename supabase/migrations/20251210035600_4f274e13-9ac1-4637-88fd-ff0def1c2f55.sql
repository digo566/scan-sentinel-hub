-- Adicionar política para master partners verem seus parceiros vinculados
CREATE POLICY "Master partners can view linked partners"
ON public.partners
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.master_partners mp
    WHERE mp.user_id = auth.uid()
    AND mp.id = partners.master_partner_id
  )
);