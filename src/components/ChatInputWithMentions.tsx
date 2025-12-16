import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Experiment } from '@/hooks/useExperiments';
import { Profile } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';
import { FlaskConical, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatInputWithMentionsProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  experiments: Experiment[];
  profiles?: Profile[];
  placeholder?: string;
  disabled?: boolean;
}

type MentionType = 'experiment' | 'user' | null;

export function ChatInputWithMentions({
  value,
  onChange,
  onSubmit,
  experiments,
  profiles = [],
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputWithMentionsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionType, setMentionType] = useState<MentionType>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter experiments based on query
  const filteredExperiments = experiments.filter(exp => 
    exp.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    exp.goal.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  // Filter profiles based on query
  const filteredProfiles = profiles.filter(profile => 
    profile.display_name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    profile.email?.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const currentItems = mentionType === 'experiment' ? filteredExperiments : filteredProfiles;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);

    const textBeforeCursor = newValue.slice(0, cursorPos);
    
    // Check for @ mention trigger (user)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    // Determine which trigger is more recent
    if (lastAtIndex > lastHashIndex && lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStartIndex(lastAtIndex);
        setMentionQuery(textAfterAt);
        setMentionType('user');
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    // Check for # mention trigger (experiment)
    if (lastHashIndex !== -1 && lastHashIndex > lastAtIndex) {
      const textAfterHash = textBeforeCursor.slice(lastHashIndex + 1);
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setMentionStartIndex(lastHashIndex);
        setMentionQuery(textAfterHash);
        setMentionType('experiment');
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionStartIndex(-1);
    setMentionType(null);
  };

  const insertExperimentMention = (experiment: Experiment) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1);
    
    // Format: #[experiment-name](experiment-id)
    const newValue = `${beforeMention}#[${experiment.name}](${experiment.id}) ${afterMention}`;
    onChange(newValue);
    closeMention();
  };

  const insertUserMention = (profile: Profile) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1);
    
    const displayName = profile.display_name || profile.email?.split('@')[0] || 'User';
    // Format: @[display-name](user-id)
    const newValue = `${beforeMention}@[${displayName}](${profile.id}) ${afterMention}`;
    onChange(newValue);
    closeMention();
  };

  const closeMention = () => {
    setShowMentions(false);
    setMentionStartIndex(-1);
    setMentionQuery('');
    setMentionType(null);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showMentions) {
      e.preventDefault();
      onSubmit();
      return;
    }

    if (!showMentions || currentItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % currentItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (mentionType === 'experiment') {
          insertExperimentMention(filteredExperiments[selectedIndex]);
        } else if (mentionType === 'user') {
          insertUserMention(filteredProfiles[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeMention();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string | null, email: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return '?';
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {/* Experiment Mentions Dropdown */}
      {showMentions && mentionType === 'experiment' && filteredExperiments.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-full max-h-48 overflow-y-auto bg-popover border border-border rounded-md shadow-lg z-50"
        >
          <div className="p-1">
            <p className="px-2 py-1 text-xs text-muted-foreground">Link an experiment</p>
            {filteredExperiments.map((experiment, index) => (
              <button
                key={experiment.id}
                type="button"
                onClick={() => insertExperimentMention(experiment)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left",
                  "hover:bg-accent transition-colors",
                  index === selectedIndex && "bg-accent"
                )}
              >
                <div className="p-1 rounded bg-primary/10">
                  <FlaskConical className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{experiment.name}</p>
                  {experiment.goal && (
                    <p className="text-xs text-muted-foreground truncate">
                      {experiment.goal}
                    </p>
                  )}
                </div>
                {experiment.rating && (
                  <span className="text-xs text-muted-foreground">
                    ★ {experiment.rating}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* User Mentions Dropdown */}
      {showMentions && mentionType === 'user' && filteredProfiles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-full max-h-48 overflow-y-auto bg-popover border border-border rounded-md shadow-lg z-50"
        >
          <div className="p-1">
            <p className="px-2 py-1 text-xs text-muted-foreground">Mention a user</p>
            {filteredProfiles.map((profile, index) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => insertUserMention(profile)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left",
                  "hover:bg-accent transition-colors",
                  index === selectedIndex && "bg-accent"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(profile.display_name, profile.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile.display_name || profile.email?.split('@')[0] || 'User'}
                  </p>
                  {profile.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* No Results */}
      {showMentions && currentItems.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-full bg-popover border border-border rounded-md shadow-lg z-50"
        >
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No {mentionType === 'experiment' ? 'experiments' : 'users'} found for "{mentionQuery}"
          </p>
        </div>
      )}
    </div>
  );
}

// Helper to parse experiment mentions from text
export function parseExperimentMentions(text: string): Array<{ type: 'text' | 'experiment'; content: string; id?: string }> {
  const parts: Array<{ type: 'text' | 'experiment'; content: string; id?: string }> = [];
  const regex = /#\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'experiment', content: match[1], id: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

// Helper to parse user mentions from text
export function parseUserMentions(text: string): Array<{ type: 'text' | 'user'; content: string; id?: string }> {
  const parts: Array<{ type: 'text' | 'user'; content: string; id?: string }> = [];
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'user', content: match[1], id: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}

// Extract mentioned user IDs from a message
export function extractMentionedUserIds(text: string): string[] {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const userIds: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    userIds.push(match[2]);
  }

  return userIds;
}

// Combined parser for both experiment and user mentions
export function parseMentions(text: string): Array<{ type: 'text' | 'experiment' | 'user'; content: string; id?: string }> {
  const parts: Array<{ type: 'text' | 'experiment' | 'user'; content: string; id?: string }> = [];
  // Match both #[name](id) and @[name](id)
  const regex = /([#@])\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const mentionType = match[1] === '#' ? 'experiment' : 'user';
    parts.push({ type: mentionType, content: match[2], id: match[3] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}