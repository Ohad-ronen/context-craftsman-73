import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTeamChat } from '@/hooks/useTeamChat';
import { useChatReactions, MessageReaction } from '@/hooks/useChatReactions';
import { useAuth } from '@/hooks/useAuth';
import { Experiment } from '@/hooks/useExperiments';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, ChevronLeft, ChevronRight, Trash2, Users, FlaskConical, SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatInputWithMentions, parseExperimentMentions } from './ChatInputWithMentions';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '🚀'];

interface TeamChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  experiments: Experiment[];
  onViewExperiment?: (id: string) => void;
}

function MessageContent({ 
  message, 
  isOwnMessage,
  onViewExperiment 
}: { 
  message: string; 
  isOwnMessage: boolean;
  onViewExperiment?: (id: string) => void;
}) {
  const parts = parseExperimentMentions(message);
  
  return (
    <span>
      {parts.map((part, index) => {
        if (part.type === 'experiment' && part.id) {
          return (
            <button
              key={index}
              onClick={() => onViewExperiment?.(part.id!)}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors",
                isOwnMessage 
                  ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
                  : "bg-primary/10 hover:bg-primary/20 text-primary"
              )}
            >
              <FlaskConical className="h-3 w-3" />
              {part.content}
            </button>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}

export function TeamChatPanel({ isOpen, onToggle, experiments, onViewExperiment }: TeamChatPanelProps) {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const { messages, isLoading, sendMessage, deleteMessage, typingUsers, setTyping } = useTeamChat(user?.id, displayName);
  const { reactions, toggleReaction } = useChatReactions();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleReaction = (messageId: string, emoji: string) => {
    if (!user) return;
    toggleReaction(messageId, emoji, user.id);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.trim()) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    const success = await sendMessage(newMessage.trim(), user.id);
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-50 h-12 w-6 rounded-r-none rounded-l-lg bg-primary/10 hover:bg-primary/20 border border-r-0 border-border/50 transition-all",
          isOpen && "right-80"
        )}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 bg-background border-l border-border/50 z-40 transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Team Chat</h2>
            <p className="text-xs text-muted-foreground">Use # to link experiments</p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === user?.id;
                const msgDisplayName = msg.profile?.display_name || msg.profile?.email?.split('@')[0] || 'Unknown';
                const msgReactions = reactions[msg.id] || [];
                
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "group flex gap-2",
                      isOwnMessage && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={msg.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(msg.profile?.display_name || null, msg.profile?.email || null)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn("flex-1 min-w-0", isOwnMessage && "text-right")}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isOwnMessage && (
                          <span className="text-xs font-medium truncate">{msgDisplayName}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {isOwnMessage && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                      <div
                        className={cn(
                          "inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] break-words text-left",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <MessageContent 
                          message={msg.message} 
                          isOwnMessage={isOwnMessage}
                          onViewExperiment={onViewExperiment}
                        />
                      </div>
                      
                      {/* Reactions row */}
                      <div className={cn("flex items-center gap-1 mt-1 flex-wrap", isOwnMessage && "justify-end")}>
                        {msgReactions.map((r) => {
                          const hasReacted = r.users.some(u => u.userId === user?.id);
                          return (
                            <button
                              key={r.emoji}
                              onClick={() => handleReaction(msg.id, r.emoji)}
                              title={r.users.map(u => u.displayName).join(', ')}
                              className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                                hasReacted 
                                  ? "bg-primary/20 border border-primary/50" 
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              <span>{r.emoji}</span>
                              <span className="text-muted-foreground">{r.users.length}</span>
                            </button>
                          );
                        })}
                        
                        {/* Add reaction button */}
                        {user && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
                                <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" side="top" align="start">
                              <div className="flex gap-1">
                                {EMOJI_OPTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(msg.id, emoji)}
                                    className="p-1.5 hover:bg-muted rounded transition-colors text-base"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
              </div>
              <span>
                {typingUsers.length === 1 
                  ? `${typingUsers[0].displayName} is typing...`
                  : `${typingUsers.map(u => u.displayName).join(', ')} are typing...`
                }
              </span>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          {user ? (
            <div className="flex gap-2">
              <ChatInputWithMentions
                value={newMessage}
                onChange={handleInputChange}
                onSubmit={handleSendMessage}
                experiments={experiments}
                placeholder="Type # to mention experiment..."
                disabled={isSending}
              />
              <Button 
                type="button" 
                size="icon" 
                disabled={!newMessage.trim() || isSending}
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Sign in to chat with your team
            </p>
          )}
        </div>
      </div>
    </>
  );
}
