-- Create annotations table for text highlighting and notes
CREATE TABLE public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  highlighted_text TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (matching experiments table pattern)
CREATE POLICY "Anyone can view annotations" 
ON public.annotations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create annotations" 
ON public.annotations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update annotations" 
ON public.annotations 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete annotations" 
ON public.annotations 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_annotations_updated_at
BEFORE UPDATE ON public.annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups by experiment
CREATE INDEX idx_annotations_experiment_id ON public.annotations(experiment_id);