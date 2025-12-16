import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AnalysisAnnotationProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface AnalysisAnnotation {
  id: string;
  analysis_id: string;
  field_name: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  note: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: AnalysisAnnotationProfile | null;
}

export interface CreateAnalysisAnnotationData {
  analysis_id: string;
  field_name: string;
  start_offset: number;
  end_offset: number;
  highlighted_text: string;
  note: string;
  user_id: string;
}

export function useAnalysisAnnotations(analysisId: string | undefined) {
  const [annotations, setAnnotations] = useState<AnalysisAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnnotations = useCallback(async () => {
    if (!analysisId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('analysis_annotations')
        .select(`
          *,
          profile:profiles(id, display_name, email, avatar_url)
        `)
        .eq('analysis_id', analysisId)
        .order('field_name', { ascending: true })
        .order('start_offset', { ascending: true });

      if (error) throw error;
      setAnnotations((data || []) as AnalysisAnnotation[]);
    } catch (error) {
      console.error('Error fetching analysis annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    fetchAnnotations();

    if (!analysisId) return;

    const channel = supabase
      .channel(`analysis-annotations-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_annotations',
          filter: `analysis_id=eq.${analysisId}`
        },
        () => {
          fetchAnnotations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [analysisId, fetchAnnotations]);

  const createAnnotation = async (data: CreateAnalysisAnnotationData): Promise<AnalysisAnnotation | null> => {
    try {
      const { data: newAnnotation, error } = await supabase
        .from('analysis_annotations')
        .insert(data)
        .select(`
          *,
          profile:profiles(id, display_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;
      toast.success('Annotation added');
      return newAnnotation as AnalysisAnnotation;
    } catch (error) {
      console.error('Error creating analysis annotation:', error);
      toast.error('Failed to add annotation');
      return null;
    }
  };

  const updateAnnotation = async (id: string, note: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('analysis_annotations')
        .update({ note })
        .eq('id', id);

      if (error) throw error;
      toast.success('Annotation updated');
      return true;
    } catch (error) {
      console.error('Error updating analysis annotation:', error);
      toast.error('Failed to update annotation');
      return false;
    }
  };

  const deleteAnnotation = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('analysis_annotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Annotation deleted');
      return true;
    } catch (error) {
      console.error('Error deleting analysis annotation:', error);
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
