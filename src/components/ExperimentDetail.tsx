import { Experiment } from '@/hooks/useExperiments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Star, Clock, Target, Compass, BookOpen, Sparkles, ScrollText, Layout, Database, Search, Brain, FileOutput, ArrowDown } from 'lucide-react';
import { AIEvaluation } from './AIEvaluation';
import { JsonViewer } from './JsonViewer';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ExperimentDetailProps {
  experiment: Experiment;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate?: (id: string, data: { rating?: number; notes?: string }) => Promise<void>;
}

const sections = [
  { key: 'goal', label: 'The Goal', icon: Target, color: 'text-step-input', bgColor: 'bg-step-input/10', borderColor: 'border-l-step-input' },
  { key: 'mission', label: 'The Mission', icon: Compass, color: 'text-step-input', bgColor: 'bg-step-input/10', borderColor: 'border-l-step-input' },
  { key: 'example', label: 'The Example', icon: BookOpen, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  { key: 'desired', label: 'Desired', icon: Sparkles, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  { key: 'rules', label: 'Rules', icon: ScrollText, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  { key: 'board_name', label: 'Board Name', icon: Layout, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'board_full_context', label: 'Board Full Context', icon: Database, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'board_pulled_context', label: 'Board Pulled Context', icon: Database, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'search_terms', label: 'Search Terms', icon: Search, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'search_context', label: 'Search Context', icon: Search, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'agentic_prompt', label: 'The Agentic Prompt', icon: Brain, color: 'text-step-output', bgColor: 'bg-step-output/10', borderColor: 'border-l-step-output' },
  { key: 'output', label: 'The Output', icon: FileOutput, color: 'text-step-output', bgColor: 'bg-step-output/10', borderColor: 'border-l-step-output' },
];

export function ExperimentDetail({ experiment, onBack, onEdit, onDelete, onUpdate }: ExperimentDetailProps) {
  const handleEvaluationComplete = async (score: number, notes: string) => {
    if (onUpdate) {
      await onUpdate(experiment.id, { rating: score, notes });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{experiment.name}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Created {format(new Date(experiment.created_at), 'MMM d, yyyy')}</span>
              </div>
              {experiment.rating && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-step-prompt fill-step-prompt" />
                  <span>{experiment.rating}/5</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Flow Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const content = experiment[section.key as keyof Experiment] as string;
          
          if (!content) return null; // Skip empty sections
          
          return (
            <div key={section.key} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <Card className={cn("glass-card border-l-4", section.borderColor)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className={cn("p-2 rounded-lg", section.bgColor)}>
                      <Icon className={cn("w-4 h-4", section.color)} />
                    </div>
                    <span>{section.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {section.key === 'output' ? (
                    <JsonViewer content={content} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/30 rounded-lg p-4 overflow-x-auto">
                      {content}
                    </pre>
                  )}
                </CardContent>
              </Card>
              {index < sections.length - 1 && content && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-muted-foreground/30" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Evaluation */}
      <AIEvaluation
        prompt={experiment.agentic_prompt}
        output={experiment.output}
        context={experiment.board_pulled_context}
        onEvaluationComplete={handleEvaluationComplete}
      />

      {/* Evaluation Notes */}
      {experiment.notes && (
        <Card className="glass-card border-l-4 border-l-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span>Evaluation Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
              {experiment.notes}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
