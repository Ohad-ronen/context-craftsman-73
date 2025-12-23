-- Add user_id column to experiments table to track who ran each experiment
ALTER TABLE public.experiments 
ADD COLUMN user_id uuid REFERENCES public.profiles(id);

-- Create index for faster lookups
CREATE INDEX idx_experiments_user_id ON public.experiments(user_id);