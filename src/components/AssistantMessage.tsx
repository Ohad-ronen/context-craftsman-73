import React from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/usePlatformAssistant';

interface AssistantMessageProps {
  message: Message;
  onExperimentClick?: (experimentId: string) => void;
}

export function AssistantMessage({ message, onExperimentClick }: AssistantMessageProps) {
  const isAssistant = message.role === 'assistant';

  if (message.isLoading) {
    return (
      <div className="flex gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-3 p-3 rounded-lg transition-colors",
      isAssistant ? "bg-muted/50" : "bg-transparent"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isAssistant ? "bg-primary/10" : "bg-secondary"
      )}>
        {isAssistant ? (
          <Bot className="w-4 h-4 text-primary" />
        ) : (
          <User className="w-4 h-4 text-secondary-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">
          {isAssistant ? 'Ask Boards Assistant' : 'You'}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {formatContent(message.content, onExperimentClick)}
        </div>
      </div>
    </div>
  );
}

function formatContent(content: string, onExperimentClick?: (experimentId: string) => void): React.ReactNode {
  // Parse experiment links [[name|id]] and bold text **text**
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Combined regex for experiment links and bold text
  const combinedRegex = /(\[\[([^\]|]+)\|([^\]]+)\]\])|(\*\*[^*]+\*\*)/g;
  let match;
  
  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    
    if (match[1]) {
      // Experiment link: [[name|id]]
      const experimentName = match[2];
      const experimentId = match[3];
      
      parts.push(
        <button
          key={`exp-${match.index}`}
          onClick={() => onExperimentClick?.(experimentId)}
          className="text-primary hover:text-primary/80 underline underline-offset-2 font-medium transition-colors cursor-pointer"
        >
          {experimentName}
        </button>
      );
    } else if (match[4]) {
      // Bold text: **text**
      const boldText = match[4];
      parts.push(<strong key={`bold-${match.index}`}>{boldText.slice(2, -2)}</strong>);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : content;
}
