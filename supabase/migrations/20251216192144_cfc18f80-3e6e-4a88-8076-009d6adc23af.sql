-- Create folders table
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS policies for folders (public access like experiments)
CREATE POLICY "Anyone can view folders" ON public.folders FOR SELECT USING (true);
CREATE POLICY "Anyone can create folders" ON public.folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update folders" ON public.folders FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete folders" ON public.folders FOR DELETE USING (true);

-- Add folder_id column to experiments table (single folder per experiment)
ALTER TABLE public.experiments ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create index for faster folder lookups
CREATE INDEX idx_experiments_folder_id ON public.experiments(folder_id);

-- Create trigger for folder timestamps
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();