import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MessageReaction {
  emoji: string;
  users: { userId: string; displayName: string }[];
}

export interface MessageReactions {
  [messageId: string]: MessageReaction[];
}

export function useChatReactions() {
  const [reactions, setReactions] = useState<MessageReactions>({});

  const fetchReactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_message_reactions')
      .select(`
        message_id,
        emoji,
        user_id,
        profiles:user_id(display_name, email)
      `);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    const grouped: MessageReactions = {};
    (data || []).forEach((r: any) => {
      if (!grouped[r.message_id]) grouped[r.message_id] = [];
      
      const existing = grouped[r.message_id].find(e => e.emoji === r.emoji);
      const displayName = r.profiles?.display_name || r.profiles?.email?.split('@')[0] || 'User';
      
      if (existing) {
        existing.users.push({ userId: r.user_id, displayName });
      } else {
        grouped[r.message_id].push({
          emoji: r.emoji,
          users: [{ userId: r.user_id, displayName }]
        });
      }
    });

    setReactions(grouped);
  }, []);

  useEffect(() => {
    fetchReactions();

    const channel = supabase
      .channel('chat-reactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_message_reactions' }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReactions]);

  const toggleReaction = async (messageId: string, emoji: string, userId: string) => {
    const messageReactions = reactions[messageId] || [];
    const existingReaction = messageReactions.find(r => r.emoji === emoji);
    const hasReacted = existingReaction?.users.some(u => u.userId === userId);

    if (hasReacted) {
      await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('chat_message_reactions')
        .insert({ message_id: messageId, user_id: userId, emoji });
    }
  };

  return { reactions, toggleReaction };
}
