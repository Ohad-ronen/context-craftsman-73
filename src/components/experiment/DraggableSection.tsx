import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DraggableSectionProps {
  id: string;
  children: ReactNode;
  onHide: () => void;
}

export function DraggableSection({ id, children, onHide }: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag handle and hide button overlay */}
      <div className="absolute -left-2 top-4 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-muted cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-destructive/10 hover:text-destructive"
          onClick={onHide}
        >
          <EyeOff className="w-3.5 h-3.5" />
        </Button>
      </div>
      {children}
    </div>
  );
}
