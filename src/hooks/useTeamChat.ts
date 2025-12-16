import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChatMessageProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface ChatMessage {
  id: string;
  user_id: string | null;
  message: string;
  created_at: string;
  edited_at: string | null;
  reply_to_id: string | null;
  profile?: ChatMessageProfile | null;
  reply_to?: {
    id: string;
    message: string;
    profile?: ChatMessageProfile | null;
  } | null;
}

export interface TypingUser {
  userId: string;
  displayName: string;
}

export interface OnlineUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

export function useTeamChat(currentUserId?: string, currentUserName?: string, currentUserAvatar?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      // Fetch messages with profile - skip self-referencing join
      const { data, error } = await supabase
        .from('team_chat_messages')
        .select(`
          *,
          profile:profiles!team_chat_messages_user_id_fkey(id, display_name, email, avatar_url)
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      // For messages that have a reply_to_id, fetch those messages separately
      const messagesWithReplies = data || [];
      const replyIds = messagesWithReplies
        .filter(m => m.reply_to_id)
        .map(m => m.reply_to_id);
      
      let repliesMap = new Map();
      if (replyIds.length > 0) {
        const { data: repliesData } = await supabase
          .from('team_chat_messages')
          .select(`
            id,
            message,
            profile:profiles!team_chat_messages_user_id_fkey(id, display_name, email, avatar_url)
          `)
          .in('id', replyIds);
        
        repliesMap = new Map(
          (repliesData || []).map(r => [r.id, r])
        );
      }
      
      // Transform data to include reply_to objects
      const transformedData = messagesWithReplies.map(msg => ({
        ...msg,
        reply_to: msg.reply_to_id ? repliesMap.get(msg.reply_to_id) || null : null
      }));
      
      setMessages(transformedData as ChatMessage[]);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time updates for messages
    const messagesChannel = supabase
      .channel('team-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_chat_messages'
        },
        async (payload) => {
          // Fetch the new message with profile
          const { data, error } = await supabase
            .from('team_chat_messages')
            .select(`
              *,
              profile:profiles!team_chat_messages_user_id_fkey(id, display_name, email, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            // If it has a reply, fetch that too
            let reply_to = null;
            if (data.reply_to_id) {
              const { data: replyData } = await supabase
                .from('team_chat_messages')
                .select(`
                  id,
                  message,
                  profile:profiles!team_chat_messages_user_id_fkey(id, display_name, email, avatar_url)
                `)
                .eq('id', data.reply_to_id)
                .single();
              reply_to = replyData || null;
            }
            
            setMessages(prev => [...prev, { ...data, reply_to } as ChatMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'team_chat_messages'
        },
        (payload) => {
          setMessages(prev => prev.map(m => 
            m.id === payload.new.id 
              ? { ...m, message: payload.new.message, edited_at: payload.new.edited_at }
              : m
          ));
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
      supabase.removeChannel(messagesChannel);
    };
  }, [fetchMessages]);

  // Presence channel for typing indicators
  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel('team-chat-presence', {
      config: { presence: { key: currentUserId } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing: TypingUser[] = [];
        const online: OnlineUser[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          if (presences.length > 0) {
            const presence = presences[0] as { isTyping?: boolean; displayName?: string; avatarUrl?: string };
            
            // Track all online users
            online.push({
              userId: key,
              displayName: presence.displayName || 'Someone',
              avatarUrl: presence.avatarUrl
            });
            
            // Track typing users (excluding self)
            if (key !== currentUserId && presence.isTyping) {
              typing.push({
                userId: key,
                displayName: presence.displayName || 'Someone'
              });
            }
          }
        });
        
        setTypingUsers(typing);
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ isTyping: false, displayName: currentUserName, avatarUrl: currentUserAvatar });
        }
      });

    channelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
      channelRef.current = null;
    };
  }, [currentUserId, currentUserName, currentUserAvatar]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!channelRef.current) return;
    
    await channelRef.current.track({ isTyping, displayName: currentUserName, avatarUrl: currentUserAvatar });
    
    // Auto-clear typing after 3 seconds
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({ isTyping: false, displayName: currentUserName, avatarUrl: currentUserAvatar });
        }
      }, 3000);
    }
  }, [currentUserName, currentUserAvatar]);

  const sendMessage = async (message: string, userId: string, replyToId?: string): Promise<boolean> => {
    try {
      // Clear typing indicator when sending
      await setTyping(false);
      
      const { error } = await supabase
        .from('team_chat_messages')
        .insert({
          message,
          user_id: userId,
          reply_to_id: replyToId || null
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

  const updateMessage = async (id: string, newMessage: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('team_chat_messages')
        .update({ 
          message: newMessage,
          edited_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
      return false;
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    updateMessage,
    refetch: fetchMessages,
    typingUsers,
    setTyping,
    onlineUsers
  };
}
