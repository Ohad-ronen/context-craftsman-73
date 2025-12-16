import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Experiment, ExperimentFormData } from '@/hooks/useExperiments';
import { fireConfetti, fireStarConfetti } from '@/lib/confetti';

export interface EvaluationResult {
  id: string;
  name: string;
  success: boolean;
  score?: number;
  error?: string;
}

export interface BulkEvaluationStats {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  averageScore: number;
}

interface UseBulkEvaluationOptions {
  experiments: Experiment[];
  updateExperiment: (id: string, data: Partial<ExperimentFormData>) => Promise<Experiment | null>;
  delayMs?: number;
}

export function useBulkEvaluation({ experiments, updateExperiment, delayMs = 1500 }: UseBulkEvaluationOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const cancelRef = useRef(false);

  // Get experiments that need evaluation (unrated with output)
  const unratedExperiments = experiments.filter(
    exp => exp.rating === null && exp.output && exp.output.trim().length > 0
  );

  const stats: BulkEvaluationStats = {
    total: unratedExperiments.length,
    completed: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    averageScore: results.filter(r => r.success && r.score).reduce((sum, r) => sum + (r.score || 0), 0) / 
      Math.max(results.filter(r => r.success && r.score).length, 1),
  };

  const evaluateExperiment = async (experiment: Experiment): Promise<EvaluationResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-experiment', {
        body: {
          prompt: experiment.agentic_prompt || '',
          output: experiment.output || '',
          context: `Goal: ${experiment.goal}\nMission: ${experiment.mission}\nDesired: ${experiment.desired}`,
        },
      });

      if (error) throw error;
      if (!data?.evaluation) throw new Error('No evaluation returned');

      const score = data.evaluation.overallScore;
      const notes = `AI Evaluation Summary:\n${data.evaluation.summary}\n\nSuggestions:\n${data.evaluation.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`;

      // Update experiment in database
      await updateExperiment(experiment.id, { rating: score, notes });

      // Fire confetti for 5-star rating
      if (score === 5) {
        fireConfetti();
        setTimeout(() => fireStarConfetti(), 500);
      }

      return { id: experiment.id, name: experiment.name, success: true, score };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { id: experiment.id, name: experiment.name, success: false, error: errorMessage };
    }
  };

  const start = useCallback(async () => {
    if (unratedExperiments.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setCurrentIndex(0);
    cancelRef.current = false;

    for (let i = 0; i < unratedExperiments.length; i++) {
      if (cancelRef.current) break;

      setCurrentIndex(i);
      const result = await evaluateExperiment(unratedExperiments[i]);
      setResults(prev => [...prev, result]);

      // Delay between evaluations to avoid rate limits
      if (i < unratedExperiments.length - 1 && !cancelRef.current) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    setIsRunning(false);

    // Fire celebration confetti if average score >= 4
    const finalResults = results;
    const avgScore = finalResults.filter(r => r.success && r.score).reduce((sum, r) => sum + (r.score || 0), 0) / 
      Math.max(finalResults.filter(r => r.success && r.score).length, 1);
    
    if (avgScore >= 4 && finalResults.length > 0) {
      fireConfetti();
    }
  }, [unratedExperiments, delayMs, updateExperiment]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setCurrentIndex(0);
    setIsRunning(false);
    cancelRef.current = false;
  }, []);

  return {
    unratedCount: unratedExperiments.length,
    unratedExperiments,
    isRunning,
    currentIndex,
    results,
    stats,
    start,
    cancel,
    reset,
  };
}
