import { useState, useMemo } from 'react';
import { Plus, ListTodo, Clock, CheckCircle2, Loader2 } from 'lucide-react';
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

interface TaskManagerProps {
  onViewExperiment?: (id: string) => void;
}

const columns: { status: TaskStatus; title: string; icon: typeof ListTodo }[] = [
  { status: 'todo', title: 'To Do', icon: ListTodo },
  { status: 'in_progress', title: 'In Progress', icon: Clock },
  { status: 'done', title: 'Done', icon: CheckCircle2 },
];

export function TaskManager({ onViewExperiment }: TaskManagerProps) {
  const { tasks, isLoading, addTask, updateTask, deleteTask, getTasksByStatus } = useTasks();
  const { experiments } = useExperiments();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const experimentsMap = useMemo(() => {
    const map = new Map(experiments.map((e) => [e.id, e]));
    return map;
  }, [experiments]);

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

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await updateTask(task.id, { status: newStatus });
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

      {/* Kanban Board */}
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

              <div className="space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30 border border-dashed">
                {columnTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No tasks
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
              </div>

              {/* Quick status change drop zone hint */}
              {column.status !== 'todo' && columnTasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Edit tasks to change status
                </p>
              )}
            </div>
          );
        })}
      </div>

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
