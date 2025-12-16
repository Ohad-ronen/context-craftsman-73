import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fireConfetti, fireStarConfetti } from '@/lib/confetti';

interface EvaluationCriteria {
  score: number;
  feedback: string;
}

interface Evaluation {
  overallScore: number;
  criteria: {
    relevance: EvaluationCriteria;
    accuracy: EvaluationCriteria;
    clarity: EvaluationCriteria;
    completeness: EvaluationCriteria;
    creativity: EvaluationCriteria;
  };
  summary: string;
  suggestions: string[];
}

interface AIEvaluationProps {
  prompt: string;
  output: string;
  context: string;
  onEvaluationComplete?: (score: number, notes: string) => void;
}

const criteriaLabels: Record<string, { label: string; color: string }> = {
  relevance: { label: 'Relevance', color: 'bg-step-input' },
  accuracy: { label: 'Accuracy', color: 'bg-step-context' },
  clarity: { label: 'Clarity', color: 'bg-step-prompt' },
  completeness: { label: 'Completeness', color: 'bg-step-output' },
  creativity: { label: 'Creativity', color: 'bg-primary' },
};

export function AIEvaluation({ prompt, output, context, onEvaluationComplete }: AIEvaluationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runEvaluation = async () => {
    if (!output) {
      toast({
        title: 'No output to evaluate',
        description: 'Please add some output content before running an evaluation.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('evaluate-experiment', {
        body: { prompt, output, context },
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setEvaluation(data.evaluation);

      // Create notes from evaluation
      const notes = `AI Evaluation Summary:\n${data.evaluation.summary}\n\nSuggestions:\n${data.evaluation.suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`;
      
      // Fire confetti for 5-star rating!
      if (data.evaluation.overallScore === 5) {
        fireConfetti();
        setTimeout(() => fireStarConfetti(), 500);
      }
      
      // Save evaluation results to backend
      if (onEvaluationComplete) {
        await onEvaluationComplete(data.evaluation.overallScore, notes);
        toast({
          title: data.evaluation.overallScore === 5 ? '🎉 Perfect Score!' : 'Evaluation complete & saved',
          description: `Overall score: ${data.evaluation.overallScore}/5 - Results saved to database.`,
        });
      } else {
        toast({
          title: data.evaluation.overallScore === 5 ? '🎉 Perfect Score!' : 'Evaluation complete',
          description: `Overall score: ${data.evaluation.overallScore}/5`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run evaluation';
      setError(message);
      toast({
        title: 'Evaluation failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-step-output';
    if (score >= 3) return 'text-step-prompt';
    if (score >= 2) return 'text-step-context';
    return 'text-destructive';
  };

  return (
    <Card className="glass-card border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-base">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span>AI-Powered Evaluation</span>
          </div>
          <Button 
            onClick={runEvaluation} 
            disabled={isLoading || !output}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Evaluation
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!evaluation && !isLoading && !error && (
          <p className="text-sm text-muted-foreground">
            Click "Run Evaluation" to analyze the output quality using AI. The evaluation will score relevance, accuracy, clarity, completeness, and creativity.
          </p>
        )}

        {evaluation && (
          <div className="space-y-6 animate-fade-in">
            {/* Overall Score */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className={cn("text-3xl font-bold", getScoreColor(evaluation.overallScore))}>
                  {evaluation.overallScore}/5
                </p>
              </div>
              <CheckCircle2 className={cn("w-10 h-10", getScoreColor(evaluation.overallScore))} />
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Criteria Breakdown</p>
              {Object.entries(evaluation.criteria).map(([key, value]) => {
                const { label, color } = criteriaLabels[key] || { label: key, color: 'bg-muted' };
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value.score}/5</span>
                    </div>
                    <Progress value={value.score * 20} className="h-2" />
                    <p className="text-xs text-muted-foreground">{value.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-secondary/30">
              <p className="text-sm font-medium mb-2">Summary</p>
              <p className="text-sm text-muted-foreground">{evaluation.summary}</p>
            </div>

            {/* Suggestions */}
            {evaluation.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-step-prompt" />
                  Improvement Suggestions
                </p>
                <ul className="space-y-2">
                  {evaluation.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-medium">{index + 1}.</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
