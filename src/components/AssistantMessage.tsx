import React from 'react';
import { Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/hooks/usePlatformAssistant';

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
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
          {formatContent(message.content)}
        </div>
      </div>
    </div>
  );
}

function formatContent(content: string): React.ReactNode {
  // Simple formatting: bold text between ** **
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
