import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface Analysis {
  overallInsights: string;
  contextPatterns: {
    findings: string[];
    recommendation: string;
  };
  promptPatterns: {
    findings: string[];
    recommendation: string;
  };
  successFactors: string[];
  improvementAreas: string[];
  topRecommendations: {
    title: string;
    description: string;
  }[];
  ratingCorrelations: {
    highRatedCommonalities: string;
    lowRatedCommonalities: string;
  };
}

export interface SavedAnalysis {
  id: string;
  title: string;
  experiment_count: number;
  experiment_ids: string[];
  analysis: Analysis;
  created_at: string;
  user_id: string | null;
}

export function useExperimentAnalyses() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('experiment_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the JSONB analysis field
      const typedData = (data || []).map(item => ({
        ...item,
        analysis: item.analysis as unknown as Analysis
      }));
      
      setAnalyses(typedData);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const saveAnalysis = async (
    analysis: Analysis,
    experimentIds: string[],
    title?: string
  ): Promise<SavedAnalysis | null> => {
    if (!user) {
      toast.error('You must be logged in to save analyses');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('experiment_analyses')
        .insert([{
          title: title || `Analysis - ${new Date().toLocaleDateString()}`,
          experiment_count: experimentIds.length,
          experiment_ids: experimentIds,
          analysis: JSON.parse(JSON.stringify(analysis)) as Json,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      const typedData = {
        ...data,
        analysis: data.analysis as unknown as Analysis
      };
      
      setAnalyses(prev => [typedData, ...prev]);
      toast.success('Analysis saved');
      return typedData;
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast.error('Failed to save analysis');
      return null;
    }
  };

  const deleteAnalysis = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('experiment_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success('Analysis deleted');
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('Failed to delete analysis');
      return false;
    }
  };

  return {
    analyses,
    isLoading,
    saveAnalysis,
    deleteAnalysis,
    refetch: fetchAnalyses
  };
}
