-- Add has_completed_tour column to profiles table
ALTER TABLE public.profiles ADD COLUMN has_completed_tour BOOLEAN DEFAULT false;