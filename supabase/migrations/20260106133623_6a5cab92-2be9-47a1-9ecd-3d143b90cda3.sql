-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own templates" ON public.experiment_templates;

-- Create new policy allowing all authenticated users to view templates
CREATE POLICY "Anyone can view templates" 
ON public.experiment_templates 
FOR SELECT 
USING (true);