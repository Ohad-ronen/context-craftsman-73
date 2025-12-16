import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeamChat } from '@/hooks/useTeamChat';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, ChevronLeft, ChevronRight, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TeamChatPanel({ isOpen, onToggle }: TeamChatPanelProps) {
  const { messages, isLoading, sendMessage, deleteMessage } = useTeamChat();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
            <p className="text-xs text-muted-foreground">Collaborate on experiments</p>
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
                const displayName = msg.profile?.display_name || msg.profile?.email?.split('@')[0] || 'Unknown';
                
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
                          <span className="text-xs font-medium truncate">{displayName}</span>
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
                          "inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] break-words",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50">
          {user ? (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={isSending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Sign in to chat with your team
            </p>
          )}
        </form>
      </div>
    </>
  );
}
