import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Annotation {
  id: string;
  experiment_id: string;
  field_name: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAnnotationData {
  experiment_id: string;
  field_name: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  note: string;
}

export function useAnnotations(experimentId: string | undefined) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnnotations = useCallback(async () => {
    if (!experimentId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('field_name', { ascending: true })
        .order('start_offset', { ascending: true });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    fetchAnnotations();

    if (!experimentId) return;

    const channel = supabase
      .channel(`annotations-${experimentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'annotations',
          filter: `experiment_id=eq.${experimentId}`
        },
        () => {
          fetchAnnotations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [experimentId, fetchAnnotations]);

  const createAnnotation = async (data: CreateAnnotationData): Promise<Annotation | null> => {
    try {
      const { data: newAnnotation, error } = await supabase
        .from('annotations')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      toast.success('Annotation added');
      return newAnnotation;
    } catch (error) {
      console.error('Error creating annotation:', error);
      toast.error('Failed to add annotation');
      return null;
    }
  };

  const updateAnnotation = async (id: string, note: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('annotations')
        .update({ note })
        .eq('id', id);

      if (error) throw error;
      toast.success('Annotation updated');
      return true;
    } catch (error) {
      console.error('Error updating annotation:', error);
      toast.error('Failed to update annotation');
      return false;
    }
  };

  const deleteAnnotation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Annotation deleted');
      return true;
    } catch (error) {
      console.error('Error deleting annotation:', error);
      toast.error('Failed to delete annotation');
      return false;
    }
  };

  const getAnnotationsForField = useCallback((fieldName: string) => {
    return annotations.filter(a => a.field_name === fieldName);
  }, [annotations]);

  return {
    annotations,
    isLoading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationsForField,
    refetch: fetchAnnotations
  };
}
