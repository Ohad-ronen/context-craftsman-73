import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  className?: string;
  size?: 'sm' | 'md';
  animated?: boolean;
}

export function TagBadge({ name, color, onRemove, className, size = 'sm', animated = false }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        "transition-all duration-200 ease-out",
        "hover:scale-105 hover:shadow-sm",
        size === 'sm' ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        animated && "animate-bounce-in",
        className
      )}
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`
      }}
    >
      <span className="relative">
        <span className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{ backgroundColor: `${color}10` }} 
        />
        {name}
      </span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/10 rounded-full p-0.5 -mr-1 transition-transform duration-200 hover:scale-110 hover:rotate-90 active:scale-95"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
