import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Folder {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFolders((data || []) as Folder[]);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch folders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();

    const channel = supabase
      .channel('folders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'folders' },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createFolder = async (name: string, color: string = '#6366f1'): Promise<Folder | null> => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({ name, color })
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state
      setFolders(prev => [...prev, data as Folder].sort((a, b) => a.name.localeCompare(b.name)));
      
      return data as Folder;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateFolder = async (id: string, data: Partial<Pick<Folder, 'name' | 'color'>>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('folders')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      // Immediately update local state
      setFolders(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
      
      return true;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to update folder',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Immediately update local state
      setFolders(prev => prev.filter(f => f.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive',
      });
      return false;
    }
  };

  const moveExperimentToFolder = async (experimentId: string, folderId: string | null): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({ folder_id: folderId })
        .eq('id', experimentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error moving experiment to folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to move experiment',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveExperimentToFolder,
    refetch: fetchFolders,
  };
}
