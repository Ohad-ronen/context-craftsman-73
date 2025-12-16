import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Experiment {
  id: string;
  name: string;
  goal: string;
  mission: string;
  example: string;
  desired: string;
  rules: string;
  board_name: string;
  board_full_context: string;
  board_pulled_context: string;
  search_terms: string;
  search_context: string;
  agentic_prompt: string;
  output: string;
  rating: number | null;
  notes: string | null;
  elo_rating: number;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExperimentFormData {
  name: string;
  goal: string;
  mission: string;
  example: string;
  desired: string;
  rules: string;
  board_name: string;
  board_full_context: string;
  board_pulled_context: string;
  search_terms: string;
  search_context: string;
  agentic_prompt: string;
  output: string;
  rating?: number;
  notes?: string;
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
          goal: data.goal,
          mission: data.mission,
          example: data.example,
          desired: data.desired,
          rules: data.rules,
          board_name: data.board_name,
          board_full_context: data.board_full_context,
          board_pulled_context: data.board_pulled_context,
          search_terms: data.search_terms,
          search_context: data.search_context,
          agentic_prompt: data.agentic_prompt,
          output: data.output,
          rating: data.rating || null,
          notes: data.notes || null,
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
      if (data.goal !== undefined) updateData.goal = data.goal;
      if (data.mission !== undefined) updateData.mission = data.mission;
      if (data.example !== undefined) updateData.example = data.example;
      if (data.desired !== undefined) updateData.desired = data.desired;
      if (data.rules !== undefined) updateData.rules = data.rules;
      if (data.board_name !== undefined) updateData.board_name = data.board_name;
      if (data.board_full_context !== undefined) updateData.board_full_context = data.board_full_context;
      if (data.board_pulled_context !== undefined) updateData.board_pulled_context = data.board_pulled_context;
      if (data.search_terms !== undefined) updateData.search_terms = data.search_terms;
      if (data.search_context !== undefined) updateData.search_context = data.search_context;
      if (data.agentic_prompt !== undefined) updateData.agentic_prompt = data.agentic_prompt;
      if (data.output !== undefined) updateData.output = data.output;
      if (data.rating !== undefined) updateData.rating = data.rating || null;
      if (data.notes !== undefined) updateData.notes = data.notes || null;

      const { data: updated, error } = await supabase
        .from('experiments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Immediately update local state for faster UI feedback
      setExperiments(prev => 
        prev.map(exp => exp.id === id ? (updated as Experiment) : exp)
      );
      
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

  const createExperimentsRowByRow = async (
    data: ExperimentFormData[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> => {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
      const exp = data[i];
      try {
        const { error } = await supabase
          .from('experiments')
          .insert({
            name: exp.name,
            goal: exp.goal,
            mission: exp.mission,
            example: exp.example,
            desired: exp.desired,
            rules: exp.rules,
            board_name: exp.board_name,
            board_full_context: exp.board_full_context,
            board_pulled_context: exp.board_pulled_context,
            search_terms: exp.search_terms,
            search_context: exp.search_context,
            agentic_prompt: exp.agentic_prompt,
            output: exp.output,
            rating: exp.rating || null,
            notes: exp.notes || null,
          });

        if (error) {
          console.error(`Error inserting row ${i + 1}:`, error);
          failed++;
        } else {
          success++;
        }
      } catch (error) {
        console.error(`Error inserting row ${i + 1}:`, error);
        failed++;
      }

      if (onProgress) {
        onProgress(i + 1, data.length);
      }
    }

    // Refetch after all imports
    await fetchExperiments();

    return { success, failed };
  };

  return {
    experiments,
    isLoading,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    getExperiment,
    createExperimentsRowByRow,
    refetch: fetchExperiments,
  };
}
