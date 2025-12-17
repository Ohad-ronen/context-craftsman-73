-- Create experiment templates table
CREATE TABLE public.experiment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT '',
  mission TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  rules TEXT NOT NULL DEFAULT '',
  use_websearch BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experiment_templates ENABLE ROW LEVEL SECURITY;

-- Users can view own templates
CREATE POLICY "Users can view own templates" 
ON public.experiment_templates 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create own templates
CREATE POLICY "Users can create own templates" 
ON public.experiment_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update own templates
CREATE POLICY "Users can update own templates" 
ON public.experiment_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete own templates
CREATE POLICY "Users can delete own templates" 
ON public.experiment_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_experiment_templates_updated_at
BEFORE UPDATE ON public.experiment_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();