-- Create a table for team chat messages
CREATE TABLE public.team_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view chat messages" 
ON public.team_chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create chat messages" 
ON public.team_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own messages" 
ON public.team_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages;