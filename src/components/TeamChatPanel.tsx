import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTeamChat, ChatMessage } from '@/hooks/useTeamChat';
import { useChatReactions, MessageReaction } from '@/hooks/useChatReactions';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { Experiment } from '@/hooks/useExperiments';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, ChevronLeft, ChevronRight, Trash2, Users, FlaskConical, SmilePlus, Circle, Reply, X, Pencil, Check, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatInputWithMentions, parseMentions, extractMentionedUserIds } from './ChatInputWithMentions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

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
  onViewExperiment,
  currentUserId
}: { 
  message: string; 
  isOwnMessage: boolean;
  onViewExperiment?: (id: string) => void;
  currentUserId?: string;
}) {
  const parts = parseMentions(message);
  
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
        if (part.type === 'user' && part.id) {
          const isMentionedUser = part.id === currentUserId;
          return (
            <span
              key={index}
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                isOwnMessage 
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : isMentionedUser
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              )}
            >
              <User className="h-3 w-3" />
              {part.content}
            </span>
          );
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
}

export function TeamChatPanel({ isOpen, onToggle, experiments, onViewExperiment }: TeamChatPanelProps) {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const { messages, isLoading, sendMessage, deleteMessage, updateMessage, typingUsers, setTyping, onlineUsers } = useTeamChat(user?.id, displayName, avatarUrl);
  const { reactions, toggleReaction } = useChatReactions();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

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

  const createMentionNotifications = async (messageText: string, senderId: string, senderName: string) => {
    const mentionedUserIds = extractMentionedUserIds(messageText);
    
    // Filter out the sender from notifications
    const usersToNotify = mentionedUserIds.filter(id => id !== senderId);
    
    for (const userId of usersToNotify) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          from_user_id: senderId,
          type: 'mention',
          title: 'New mention',
          message: `${senderName} mentioned you in a chat message`,
          link: '/?chat=open'
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();
    const success = await sendMessage(messageText, user.id, replyingTo?.id);
    if (success) {
      // Create notifications for mentioned users
      await createMentionNotifications(messageText, user.id, displayName);
      setNewMessage('');
      setReplyingTo(null);
    }
    setIsSending(false);
  };

  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editingText.trim()) return;
    const success = await updateMessage(editingMessageId, editingText.trim());
    if (success) {
      cancelEditing();
    }
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
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">Team Chat</h2>
              <p className="text-xs text-muted-foreground">Use # to link experiments</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn("h-8 w-8", isSearchOpen && "bg-primary/10")}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Input */}
          {isSearchOpen && (
            <div className="mt-3 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-8 text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          )}
          
          {/* Online Users */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                <span>{onlineUsers.length} online</span>
              </div>
              <div className="flex -space-x-2">
                <TooltipProvider>
                  {onlineUsers.slice(0, 5).map((onlineUser) => (
                    <Tooltip key={onlineUser.userId}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6 border-2 border-background ring-2 ring-green-500/30">
                          <AvatarImage src={onlineUser.avatarUrl} />
                          <AvatarFallback className="text-[10px]">
                            {onlineUser.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{onlineUser.displayName}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {onlineUsers.length > 5 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">+{onlineUsers.length - 5}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{onlineUsers.slice(5).map(u => u.displayName).join(', ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            </div>
          )}
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
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No messages found</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => {
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
                    <div className={cn("flex-1 min-w-0 overflow-hidden", isOwnMessage && "flex flex-col items-end")}>
                      <div className={cn("flex items-center gap-2 mb-1 flex-wrap", isOwnMessage && "justify-end")}>
                        {!isOwnMessage && (
                          <span className="text-xs font-medium truncate max-w-[120px]">{msgDisplayName}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                        {msg.edited_at && (
                          <span className="text-[10px] text-muted-foreground italic">(edited)</span>
                        )}
                        {isOwnMessage && editingMessageId !== msg.id && (
                          <>
                            <button
                              onClick={() => startEditing(msg)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </button>
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                      {/* Reply context */}
                      {msg.reply_to && (
                        <div className="mb-1 px-2 py-1 rounded border-l-2 border-primary/50 bg-muted/50 text-xs text-muted-foreground max-w-full overflow-hidden">
                          <span className="font-medium truncate block">
                            {msg.reply_to.profile?.display_name || msg.reply_to.profile?.email?.split('@')[0] || 'Unknown'}
                          </span>
                          <p className="truncate">{msg.reply_to.message}</p>
                        </div>
                      )}
                      {editingMessageId === msg.id ? (
                        <div className="flex items-center gap-1 w-full max-w-full">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEditing();
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <button onClick={saveEdit} className="p-1 hover:bg-muted rounded">
                            <Check className="h-4 w-4 text-green-500" />
                          </button>
                          <button onClick={cancelEditing} className="p-1 hover:bg-muted rounded">
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm max-w-full break-words",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                        >
                          <MessageContent 
                            message={msg.message} 
                            isOwnMessage={isOwnMessage}
                            onViewExperiment={onViewExperiment}
                            currentUserId={user?.id}
                          />
                        </div>
                      )}
                      
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
                          <>
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
                            
                            {/* Reply button */}
                            <button 
                              onClick={() => setReplyingTo(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                            >
                              <Reply className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </>
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
            <div className="space-y-2">
              {/* Reply indicator */}
              {replyingTo && (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded-lg text-xs">
                  <Reply className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-muted-foreground">Replying to </span>
                    <span className="font-medium">
                      {replyingTo.profile?.display_name || replyingTo.profile?.email?.split('@')[0] || 'Unknown'}
                    </span>
                    <p className="truncate text-muted-foreground">{replyingTo.message}</p>
                  </div>
                  <button 
                    onClick={() => setReplyingTo(null)}
                    className="p-0.5 hover:bg-muted rounded"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <ChatInputWithMentions
                  value={newMessage}
                  onChange={handleInputChange}
                  onSubmit={handleSendMessage}
                  experiments={experiments}
                  profiles={profiles}
                  placeholder={replyingTo ? "Write a reply..." : "Type @ to mention users, # for experiments..."}
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
