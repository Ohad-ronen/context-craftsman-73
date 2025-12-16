import { useState, useMemo } from 'react';
import { Plus, ListTodo, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTasks, Task, TaskFormData, TaskStatus } from '@/hooks/useTasks';
import { useExperiments } from '@/hooks/useExperiments';
import { TaskCard } from '@/components/TaskCard';
import { TaskDialog } from '@/components/TaskDialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskManagerProps {
  onViewExperiment?: (id: string) => void;
}

const columns: { status: TaskStatus; title: string; icon: typeof ListTodo }[] = [
  { status: 'todo', title: 'To Do', icon: ListTodo },
  { status: 'in_progress', title: 'In Progress', icon: Clock },
  { status: 'done', title: 'Done', icon: CheckCircle2 },
];

interface DroppableColumnProps {
  status: TaskStatus;
  children: React.ReactNode;
  isOver: boolean;
}

function DroppableColumn({ status, children, isOver }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'space-y-2 min-h-[200px] p-2 rounded-lg border border-dashed transition-colors',
        isOver ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-border'
      )}
    >
      {children}
    </div>
  );
}

export function TaskManager({ onViewExperiment }: TaskManagerProps) {
  const { tasks, isLoading, addTask, updateTask, deleteTask, getTasksByStatus } = useTasks();
  const { experiments } = useExperiments();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const experimentsMap = useMemo(() => {
    const map = new Map(experiments.map((e) => [e.id, e]));
    return map;
  }, [experiments]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Check if we're over a column
      const columnStatus = columns.find((c) => c.status === over.id)?.status;
      if (columnStatus) {
        setOverColumn(columnStatus);
        return;
      }
      // Check if we're over a task (find its column)
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        setOverColumn(overTask.status);
        return;
      }
    }
    setOverColumn(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumn(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const task = tasks.find((t) => t.id === activeTaskId);
    if (!task) return;

    // Determine the target status
    let targetStatus: TaskStatus | null = null;

    // Check if dropped on a column
    const columnStatus = columns.find((c) => c.status === over.id)?.status;
    if (columnStatus) {
      targetStatus = columnStatus;
    } else {
      // Dropped on another task - use that task's status
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Update if status changed
    if (targetStatus && targetStatus !== task.status) {
      await updateTask(task.id, { status: targetStatus });
      
      const statusLabels: Record<TaskStatus, string> = {
        todo: 'To Do',
        in_progress: 'In Progress',
        done: 'Done',
      };
      
      toast({
        title: 'Task moved',
        description: `"${task.title}" moved to ${statusLabels[targetStatus]}`,
      });
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    const success = await deleteTask(taskToDelete.id);
    if (success) {
      toast({
        title: 'Task deleted',
        description: 'The task has been removed.',
      });
    }
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      const updated = await updateTask(editingTask.id, data);
      if (updated) {
        toast({
          title: 'Task updated',
          description: 'Your changes have been saved.',
        });
      }
    } else {
      const created = await addTask(data);
      if (created) {
        toast({
          title: 'Task created',
          description: 'Your task has been added.',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Manager</h2>
          <p className="text-muted-foreground">
            Track improvements and iterations for your experiments
          </p>
        </div>
        <Button onClick={handleCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="bg-card rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedCount} of {tasks.length} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Kanban Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.status);
            const Icon = column.icon;

            return (
              <div key={column.status} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{column.title}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                <SortableContext
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn status={column.status} isOver={overColumn === column.status}>
                    {columnTasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        {overColumn === column.status ? 'Drop here' : 'No tasks'}
                      </p>
                    ) : (
                      columnTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          experiment={task.experiment_id ? experimentsMap.get(task.experiment_id) : undefined}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteClick}
                          onViewExperiment={onViewExperiment}
                        />
                      ))
                    )}
                  </DroppableColumn>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90">
              <TaskCard
                task={activeTask}
                experiment={activeTask.experiment_id ? experimentsMap.get(activeTask.experiment_id) : undefined}
                onEdit={() => {}}
                onDelete={() => {}}
                onViewExperiment={onViewExperiment}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create tasks to track improvements and iterations based on your experiment insights.
          </p>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first task
          </Button>
        </div>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        task={editingTask}
        experiments={experiments}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
