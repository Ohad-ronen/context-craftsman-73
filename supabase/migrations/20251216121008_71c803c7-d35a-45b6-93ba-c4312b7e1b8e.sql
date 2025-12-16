-- Create experiment_analyses table to store analysis results
CREATE TABLE public.experiment_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Analysis',
  experiment_count INTEGER NOT NULL,
  experiment_ids UUID[] NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.experiment_analyses ENABLE ROW LEVEL SECURITY;

-- Anyone can view analyses
CREATE POLICY "Anyone can view experiment analyses"
ON public.experiment_analyses
FOR SELECT
USING (true);

-- Authenticated users can create analyses
CREATE POLICY "Authenticated users can create analyses"
ON public.experiment_analyses
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
ON public.experiment_analyses
FOR DELETE
USING (auth.uid() = user_id);