import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useBulkEvaluation } from '@/hooks/useBulkEvaluation';
import { Experiment, ExperimentFormData } from '@/hooks/useExperiments';
import { Bot, CheckCircle2, XCircle, Loader2, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAIEvaluationProps {
  isOpen: boolean;
  onClose: () => void;
  experiments: Experiment[];
  updateExperiment: (id: string, data: Partial<ExperimentFormData>) => Promise<Experiment | null>;
}

export function BulkAIEvaluation({ isOpen, onClose, experiments, updateExperiment }: BulkAIEvaluationProps) {
  const {
    unratedCount,
    unratedExperiments,
    isRunning,
    currentIndex,
    results,
    stats,
    start,
    cancel,
    reset,
  } = useBulkEvaluation({ experiments, updateExperiment });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    if (isRunning) {
      cancel();
    }
    onClose();
  };

  const progress = unratedCount > 0 ? (results.length / unratedCount) * 100 : 0;
  const isComplete = results.length === unratedCount && unratedCount > 0;

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderStars = (score: number) => {
    return (
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(
              'w-3 h-3',
              i <= score ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            )}
          />
        ))}
      </span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Bulk AI Evaluation
          </DialogTitle>
          <DialogDescription>
            {unratedCount === 0 
              ? 'All experiments with outputs have been rated!'
              : `Evaluate ${unratedCount} unrated experiment${unratedCount !== 1 ? 's' : ''} with AI`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress Section */}
          {(isRunning || isComplete) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isComplete ? 'Complete!' : `Evaluating ${currentIndex + 1} of ${unratedCount}`}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results Feed */}
          {results.length > 0 && (
            <ScrollArea className="h-[240px] border rounded-lg">
              <div className="p-3 space-y-2">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md text-sm',
                      result.success ? 'bg-green-500/10' : 'bg-destructive/10'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className="truncate">{result.name}</span>
                    </div>
                    {result.success && result.score !== undefined ? (
                      <div className="flex items-center gap-2 shrink-0">
                        {renderStars(result.score)}
                        {result.score === 5 && <Sparkles className="w-3 h-3 text-yellow-400" />}
                      </div>
                    ) : (
                      <span className="text-xs text-destructive truncate max-w-[120px]">
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}

                {/* Currently evaluating indicator */}
                {isRunning && currentIndex < unratedExperiments.length && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 text-sm">
                    <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                    <span className="truncate">{unratedExperiments[currentIndex]?.name}</span>
                    <span className="text-muted-foreground ml-auto">Evaluating...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Summary Stats */}
          {isComplete && (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-500">{stats.successful}</div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className={cn('text-2xl font-bold', getScoreColor(stats.averageScore))}>
                  {stats.averageScore.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {unratedCount === 0 && !isComplete && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">
                All experiments with outputs have been evaluated!
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {isRunning ? (
            <Button variant="destructive" onClick={cancel}>
              Cancel
            </Button>
          ) : isComplete ? (
            <Button onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={start} 
                disabled={unratedCount === 0}
                className="gap-2"
              >
                <Bot className="w-4 h-4" />
                Evaluate {unratedCount} Experiment{unratedCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
