import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Experiment } from '@/hooks/useExperiments';
import { cn } from '@/lib/utils';
import { FlaskConical } from 'lucide-react';

interface ChatInputWithMentionsProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  experiments: Experiment[];
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInputWithMentions({
  value,
  onChange,
  onSubmit,
  experiments,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputWithMentionsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter experiments based on query
  const filteredExperiments = experiments.filter(exp => 
    exp.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    exp.goal.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);

    // Check for # mention trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const textAfterHash = textBeforeCursor.slice(lastHashIndex + 1);
      // Check if there's no space after # (still typing mention)
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setMentionStartIndex(lastHashIndex);
        setMentionQuery(textAfterHash);
        setShowMentions(true);
        setSelectedIndex(0);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionStartIndex(-1);
  };

  const insertMention = (experiment: Experiment) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(mentionStartIndex + mentionQuery.length + 1);
    
    // Format: #[experiment-name](experiment-id)
    const newValue = `${beforeMention}#[${experiment.name}](${experiment.id}) ${afterMention}`;
    onChange(newValue);
    
    setShowMentions(false);
    setMentionStartIndex(-1);
    setMentionQuery('');

    // Focus back on input
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

    if (!showMentions || filteredExperiments.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredExperiments.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredExperiments.length) % filteredExperiments.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        insertMention(filteredExperiments[selectedIndex]);
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
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      {showMentions && filteredExperiments.length > 0 && (
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
                onClick={() => insertMention(experiment)}
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
      
      {showMentions && filteredExperiments.length === 0 && mentionQuery && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full mb-1 left-0 w-full bg-popover border border-border rounded-md shadow-lg z-50"
        >
          <p className="px-3 py-2 text-sm text-muted-foreground">
            No experiments found for "{mentionQuery}"
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
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    
    // Add the experiment mention
    parts.push({ type: 'experiment', content: match[1], id: match[2] });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: text }];
}
