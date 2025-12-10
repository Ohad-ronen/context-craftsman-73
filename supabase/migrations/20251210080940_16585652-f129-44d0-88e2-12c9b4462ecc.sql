-- Create experiments table
CREATE TABLE public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  raw_data_sources TEXT NOT NULL DEFAULT '',
  extracted_context TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL DEFAULT '',
  full_injection TEXT NOT NULL DEFAULT '',
  output TEXT NOT NULL DEFAULT '',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'evaluating')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (no auth required for now)
CREATE POLICY "Anyone can view experiments" 
ON public.experiments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert experiments" 
ON public.experiments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update experiments" 
ON public.experiments 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete experiments" 
ON public.experiments 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_experiments_updated_at
BEFORE UPDATE ON public.experiments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.experiments;