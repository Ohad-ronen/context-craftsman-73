import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { ExperimentCard } from '@/components/ExperimentCard';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface DraggableExperimentCardProps {
  experiment: Experiment;
  tags?: Tag[];
  onClick: () => void;
}

export function DraggableExperimentCard({ experiment, tags, onClick }: DraggableExperimentCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `experiment-${experiment.id}`,
    data: { type: 'experiment', experimentId: experiment.id },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : undefined,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/drag",
        isDragging && "opacity-50"
      )}
    >
      {/* Drag handle */}
      <div
        {...listeners}
        {...attributes}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded bg-muted/80 opacity-0 group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <ExperimentCard
        experiment={experiment}
        tags={tags}
        onClick={onClick}
      />
    </div>
  );
}
