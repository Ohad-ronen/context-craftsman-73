import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  user_id: string | null;
  message: string;
  created_at: string;
  profile?: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export function useTeamChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('team_chat_messages')
        .select(`
          *,
          profile:profiles(id, display_name, email, avatar_url)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('team-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages'
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data, error } = await supabase
            .from('team_chat_messages')
            .select(`
              *,
              profile:profiles(id, display_name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setMessages(prev => [...prev, data as ChatMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'team_chat_messages'
        },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const sendMessage = async (message: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_chat_messages')
        .insert({
          message,
          user_id: userId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  };

  const deleteMessage = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_chat_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      return false;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    refetch: fetchMessages
  };
}
