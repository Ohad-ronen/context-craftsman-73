-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to annotations
ALTER TABLE public.annotations 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop existing annotation policies
DROP POLICY IF EXISTS "Anyone can create annotations" ON public.annotations;
DROP POLICY IF EXISTS "Anyone can delete annotations" ON public.annotations;
DROP POLICY IF EXISTS "Anyone can update annotations" ON public.annotations;
DROP POLICY IF EXISTS "Anyone can view annotations" ON public.annotations;

-- Create new annotation policies with authentication
CREATE POLICY "Authenticated users can view annotations" ON public.annotations
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create annotations" ON public.annotations
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations" ON public.annotations
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations" ON public.annotations
FOR DELETE TO authenticated USING (auth.uid() = user_id);