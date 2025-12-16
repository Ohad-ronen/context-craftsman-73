import { format, isPast, isToday } from 'date-fns';
import { Calendar, Beaker, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TaskPriority } from '@/hooks/useTasks';
import { Experiment } from '@/hooks/useExperiments';

interface TaskCardProps {
  task: Task;
  experiment?: Experiment;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewExperiment?: (id: string) => void;
  isDragging?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-destructive/10 text-destructive',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TaskCard({
  task,
  experiment,
  onEdit,
  onDelete,
  onViewExperiment,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && task.status !== 'done';
  const isDueToday = dueDate && isToday(dueDate);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <h4 className="font-medium text-sm leading-tight line-clamp-2 flex-1">
              {task.title}
            </h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Pencil className="h-3 w-3 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap pl-6">
          <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
            {priorityLabels[task.priority]}
          </Badge>

          {dueDate && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                isOverdue && 'border-destructive text-destructive',
                isDueToday && 'border-primary text-primary'
              )}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {format(dueDate, 'MMM d')}
            </Badge>
          )}
        </div>

        {experiment && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewExperiment?.(experiment.id);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors pl-6"
          >
            <Beaker className="h-3 w-3" />
            <span className="truncate max-w-[150px]">{experiment.name}</span>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
