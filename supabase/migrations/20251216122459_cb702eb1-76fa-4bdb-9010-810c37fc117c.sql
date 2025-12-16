-- Create a table for analysis annotations
CREATE TABLE public.analysis_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.experiment_analyses(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  highlighted_text TEXT NOT NULL,
  note TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_annotations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view analysis annotations" 
ON public.analysis_annotations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create analysis annotations" 
ON public.analysis_annotations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis annotations" 
ON public.analysis_annotations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis annotations" 
ON public.analysis_annotations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analysis_annotations_updated_at
BEFORE UPDATE ON public.analysis_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();