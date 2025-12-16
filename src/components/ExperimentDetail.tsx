import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { useAnnotations } from '@/hooks/useAnnotations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagInput } from '@/components/TagInput';
import { ArrowLeft, Edit, Trash2, Star, Clock, Target, Compass, BookOpen, Sparkles, ScrollText, Layout, Database, Search, Brain, FileOutput, ArrowDown, Tags } from 'lucide-react';
import { AIEvaluation } from './AIEvaluation';
import { AnnotatableText, AnnotatableJson, AnnotationsSummary } from './annotations';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ExperimentDetailProps {
  experiment: Experiment;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate?: (id: string, data: { rating?: number; notes?: string }) => Promise<void>;
  tags?: Tag[];
  experimentTags?: Tag[];
  onAddTag?: (tagId: string) => Promise<boolean>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
  onCreateTag?: (name: string, color: string) => Promise<Tag | null>;
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

export function ExperimentDetail({ 
  experiment, 
  onBack, 
  onEdit, 
  onDelete, 
  onUpdate,
  tags = [],
  experimentTags = [],
  onAddTag,
  onRemoveTag,
  onCreateTag
}: ExperimentDetailProps) {
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationsForField,
  } = useAnnotations(experiment.id);

  const handleEvaluationComplete = async (score: number, notes: string) => {
    if (onUpdate) {
      await onUpdate(experiment.id, { rating: score, notes });
    }
  };

  // Check if content is JSON
  const isJson = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
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

      {/* Tags Section */}
      {onAddTag && onRemoveTag && onCreateTag && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tags className="w-4 h-4 text-primary" />
              </div>
              <span>Tags</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TagInput
              availableTags={tags}
              selectedTags={experimentTags}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onCreateTag={onCreateTag}
            />
          </CardContent>
        </Card>
      )}

      {/* Annotations Summary */}
      {annotations.length > 0 && (
        <AnnotationsSummary
          annotations={annotations}
          onDelete={deleteAnnotation}
        />
      )}

      {/* Flow Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const content = experiment[section.key as keyof Experiment] as string;
          
          if (!content) return null; // Skip empty sections

          const fieldAnnotations = getAnnotationsForField(section.key);
          const contentIsJson = isJson(content);
          
          return (
            <div key={section.key} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <Card className={cn("glass-card border-l-4", section.borderColor)}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className={cn("p-2 rounded-lg", section.bgColor)}>
                      <Icon className={cn("w-4 h-4", section.color)} />
                    </div>
                    <span>{section.label}</span>
                    {fieldAnnotations.length > 0 && (
                      <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        {fieldAnnotations.length} note{fieldAnnotations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contentIsJson ? (
                    <AnnotatableJson
                      content={content}
                      fieldName={section.key}
                      experimentId={experiment.id}
                      annotations={fieldAnnotations}
                      onCreateAnnotation={createAnnotation}
                      onUpdateAnnotation={updateAnnotation}
                      onDeleteAnnotation={deleteAnnotation}
                    />
                  ) : (
                    <AnnotatableText
                      content={content}
                      fieldName={section.key}
                      experimentId={experiment.id}
                      annotations={fieldAnnotations}
                      onCreateAnnotation={createAnnotation}
                      onUpdateAnnotation={updateAnnotation}
                      onDeleteAnnotation={deleteAnnotation}
                    />
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
