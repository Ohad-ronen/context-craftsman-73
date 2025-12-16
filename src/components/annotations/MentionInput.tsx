import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: MentionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { profiles, searchProfiles } = useProfiles();
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const filteredProfiles = searchProfiles(mentionQuery);

  const getInitials = (profile: Profile) => {
    if (profile.display_name) {
      return profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return profile.email?.[0]?.toUpperCase() || 'U';
  };

  const updateDropdownPosition = useCallback(() => {
    if (!textareaRef.current || mentionStartIndex === -1) return;

    const textarea = textareaRef.current;
    const textBeforeCursor = value.slice(0, mentionStartIndex);
    
    // Create a hidden div to measure text position
    const mirror = document.createElement('div');
    mirror.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      font: ${getComputedStyle(textarea).font};
      padding: ${getComputedStyle(textarea).padding};
      width: ${textarea.clientWidth}px;
      line-height: ${getComputedStyle(textarea).lineHeight};
    `;
    mirror.textContent = textBeforeCursor;
    document.body.appendChild(mirror);

    const rect = textarea.getBoundingClientRect();
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const lines = mirror.clientHeight / lineHeight;
    
    document.body.removeChild(mirror);

    setDropdownPosition({
      top: Math.min(lines * lineHeight, textarea.clientHeight) + 4,
      left: 0,
    });
  }, [value, mentionStartIndex]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Check for @ mention trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStartIndex(lastAtIndex);
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionStartIndex(-1);
  };

  const insertMention = (profile: Profile) => {
    if (mentionStartIndex === -1) return;

    const displayName = profile.display_name || profile.email || 'User';
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1);
    
    const newValue = `${beforeMention}@${displayName} ${afterMention}`;
    onChange(newValue);
    
    setShowMentions(false);
    setMentionStartIndex(-1);
    setMentionQuery('');

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + displayName.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || filteredProfiles.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredProfiles.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredProfiles.length) % filteredProfiles.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        insertMention(filteredProfiles[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position when showing
  useEffect(() => {
    if (showMentions) {
      updateDropdownPosition();
    }
  }, [showMentions, updateDropdownPosition]);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("min-h-[80px] text-sm resize-none", className)}
        autoFocus={autoFocus}
      />
      
      {showMentions && filteredProfiles.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full max-h-48 overflow-y-auto bg-popover border border-border rounded-md shadow-lg"
          style={{ top: dropdownPosition.top }}
        >
          <div className="p-1">
            <p className="px-2 py-1 text-xs text-muted-foreground">Mention a user</p>
            {filteredProfiles.map((profile, index) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => insertMention(profile)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left",
                  "hover:bg-accent transition-colors",
                  index === selectedIndex && "bg-accent"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(profile)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile.display_name || 'Unknown'}
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
      
      {showMentions && filteredProfiles.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-lg"
          style={{ top: dropdownPosition.top }}
        >
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No users found for "{mentionQuery}"
          </p>
        </div>
      )}
    </div>
  );
}
