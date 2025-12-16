-- Allow users to update their own messages
CREATE POLICY "Users can update own messages" 
ON public.team_chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add edited_at column to track when messages were edited
ALTER TABLE public.team_chat_messages 
ADD COLUMN edited_at timestamp with time zone;