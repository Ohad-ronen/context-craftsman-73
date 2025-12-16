import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
}

// Renders text with @mentions highlighted
export function MentionText({ text, className }: MentionTextProps) {
  const parts = useMemo(() => {
    // Match @username patterns (letters, numbers, spaces until next @ or end)
    const mentionRegex = /@([^\s@][^@]*?)(?=\s|$|@)/g;
    const result: { type: 'text' | 'mention'; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        result.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      // Add mention
      result.push({ type: 'mention', content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return result;
  }, [text]);

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.type === 'mention' ? (
          <span
            key={index}
            className={cn(
              "inline-flex items-center px-1 py-0.5 rounded",
              "bg-primary/10 text-primary font-medium text-[0.9em]"
            )}
          >
            @{part.content}
          </span>
        ) : (
          <span key={index}>{part.content}</span>
        )
      )}
    </span>
  );
}
