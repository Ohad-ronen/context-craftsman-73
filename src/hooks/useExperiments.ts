import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  raw_data_sources: string;
  extracted_context: string;
  prompt: string;
  full_injection: string;
  output: string;
  rating: number | null;
  notes: string | null;
  status: 'draft' | 'completed' | 'evaluating';
  created_at: string;
  updated_at: string;
}

export interface ExperimentFormData {
  name: string;
  description?: string;
  raw_data_sources: string;
  extracted_context: string;
  prompt: string;
  full_injection: string;
  output: string;
  rating?: number;
  notes?: string;
  status: 'draft' | 'completed' | 'evaluating';
}

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchExperiments = async () => {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExperiments((data || []) as Experiment[]);
    } catch (error) {
      console.error('Error fetching experiments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch experiments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('experiments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'experiments' },
        () => {
          fetchExperiments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addExperiment = async (data: ExperimentFormData): Promise<Experiment | null> => {
    try {
      const { data: newExperiment, error } = await supabase
        .from('experiments')
        .insert({
          name: data.name,
          description: data.description || null,
          raw_data_sources: data.raw_data_sources,
          extracted_context: data.extracted_context,
          prompt: data.prompt,
          full_injection: data.full_injection,
          output: data.output,
          rating: data.rating || null,
          notes: data.notes || null,
          status: data.status,
        })
        .select()
        .single();

      if (error) throw error;
      return newExperiment as Experiment;
    } catch (error) {
      console.error('Error adding experiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create experiment',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateExperiment = async (id: string, data: Partial<ExperimentFormData>): Promise<Experiment | null> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.raw_data_sources !== undefined) updateData.raw_data_sources = data.raw_data_sources;
      if (data.extracted_context !== undefined) updateData.extracted_context = data.extracted_context;
      if (data.prompt !== undefined) updateData.prompt = data.prompt;
      if (data.full_injection !== undefined) updateData.full_injection = data.full_injection;
      if (data.output !== undefined) updateData.output = data.output;
      if (data.rating !== undefined) updateData.rating = data.rating || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: updated, error } = await supabase
        .from('experiments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated as Experiment;
    } catch (error) {
      console.error('Error updating experiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update experiment',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteExperiment = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting experiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete experiment',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getExperiment = (id: string): Experiment | undefined => {
    return experiments.find(exp => exp.id === id);
  };

  return {
    experiments,
    isLoading,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    getExperiment,
    refetch: fetchExperiments,
  };
}
