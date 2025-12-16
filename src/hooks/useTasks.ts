import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  experiment_id: string | null;
  analysis_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  experiment_id?: string | null;
  analysis_id?: string | null;
  due_date?: string | null;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }

    setTasks(data as Task[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();

    // Set up realtime subscription
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const addTask = async (data: TaskFormData): Promise<Task | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create tasks.",
        variant: "destructive",
      });
      return null;
    }

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description || null,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        experiment_id: data.experiment_id || null,
        analysis_id: data.analysis_id || null,
        due_date: data.due_date || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
      return null;
    }

    return newTask as Task;
  };

  const updateTask = async (id: string, data: Partial<TaskFormData & { completed_at?: string | null }>): Promise<Task | null> => {
    const updateData: Record<string, unknown> = { ...data };
    
    // If status is changing to 'done', set completed_at
    if (data.status === 'done') {
      updateData.completed_at = new Date().toISOString();
    } else if (data.status) {
      updateData.completed_at = null;
    }

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
      return null;
    }

    return updatedTask as Task;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter(task => task.status === status);
  };

  const pendingTaskCount = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    pendingTaskCount,
  };
}
