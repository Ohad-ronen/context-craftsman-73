-- Create tags table
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for experiment tags
CREATE TABLE public.experiment_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(experiment_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for tags (anyone can CRUD since experiments are public)
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Anyone can create tags" ON public.tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tags" ON public.tags FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tags" ON public.tags FOR DELETE USING (true);

-- RLS policies for experiment_tags
CREATE POLICY "Anyone can view experiment_tags" ON public.experiment_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can create experiment_tags" ON public.experiment_tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete experiment_tags" ON public.experiment_tags FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_experiment_tags_experiment_id ON public.experiment_tags(experiment_id);
CREATE INDEX idx_experiment_tags_tag_id ON public.experiment_tags(tag_id);