-- Add Elo rating column to experiments table
ALTER TABLE public.experiments 
ADD COLUMN elo_rating integer NOT NULL DEFAULT 1200;

-- Create a table to track battle history
CREATE TABLE public.battle_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  winner_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  loser_id uuid NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  winner_elo_before integer NOT NULL,
  winner_elo_after integer NOT NULL,
  loser_elo_before integer NOT NULL,
  loser_elo_after integer NOT NULL,
  goal text NOT NULL,
  board_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view battle history
CREATE POLICY "Anyone can view battle history" 
ON public.battle_history 
FOR SELECT 
USING (true);

-- Authenticated users can create battle records
CREATE POLICY "Authenticated users can create battle history" 
ON public.battle_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for battle_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_history;