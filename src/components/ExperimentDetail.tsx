import { Experiment } from '@/hooks/useExperiments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Star, Clock, Database, Brain, MessageSquare, Sparkles, FileOutput, ArrowDown } from 'lucide-react';
import { AIEvaluation } from './AIEvaluation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ExperimentDetailProps {
  experiment: Experiment;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate?: (id: string, data: { rating?: number; notes?: string }) => Promise<void>;
}

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-step-output/20 text-step-output',
  evaluating: 'bg-step-prompt/20 text-step-prompt',
};

const sections = [
  { key: 'raw_data_sources', label: 'Raw Data Sources', icon: Database, color: 'text-step-input', bgColor: 'bg-step-input/10', borderColor: 'border-l-step-input' },
  { key: 'extracted_context', label: 'Extracted Context', icon: Brain, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  { key: 'prompt', label: 'Prompt Template', icon: MessageSquare, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'full_injection', label: 'Full Prompt + Context', icon: Sparkles, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  { key: 'output', label: 'Generated Output', icon: FileOutput, color: 'text-step-output', bgColor: 'bg-step-output/10', borderColor: 'border-l-step-output' },
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
            {experiment.description && (
              <p className="text-muted-foreground mt-1">{experiment.description}</p>
            )}
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
              <Badge className={cn(statusColors[experiment.status])}>
                {experiment.status}
              </Badge>
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
          
          return (
            <div key={section.key} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
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
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/30 rounded-lg p-4 overflow-x-auto">
                    {content || <span className="text-muted-foreground italic">No content</span>}
                  </pre>
                </CardContent>
              </Card>
              {index < sections.length - 1 && (
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
        prompt={experiment.prompt}
        output={experiment.output}
        context={experiment.extracted_context}
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
