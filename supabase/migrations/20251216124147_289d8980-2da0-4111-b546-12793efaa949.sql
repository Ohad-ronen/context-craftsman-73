-- Add reply_to_id column to team_chat_messages table
ALTER TABLE public.team_chat_messages 
ADD COLUMN reply_to_id uuid REFERENCES public.team_chat_messages(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX idx_team_chat_messages_reply_to ON public.team_chat_messages(reply_to_id);