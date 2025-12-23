import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useExperimentLayout } from '@/hooks/useExperimentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagInput } from '@/components/TagInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Edit, Trash2, Star, Clock, Target, Compass, BookOpen, Sparkles, ScrollText, Layout, Database, Search, Brain, FileOutput, Tags, Globe, Link, Copy, Check, User } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { ExperimentListPanel } from './experiment/ExperimentListPanel';
import { useToast } from '@/hooks/use-toast';
import { AIEvaluation } from './AIEvaluation';
import { AnnotatableText, AnnotatableJson, AnnotationsSummary } from './annotations';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DraggableSection } from './experiment/DraggableSection';
import { ExperimentCanvas } from './experiment/ExperimentCanvas';
import { LayoutToolbar } from './experiment/LayoutToolbar';

interface ExperimentDetailProps {
  experiment: Experiment;
  experiments?: Experiment[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate?: (id: string, data: { rating?: number; notes?: string }) => Promise<void>;
  onNavigateToExperiment?: (id: string) => void;
  getTagsForExperiment?: (experimentId: string) => Tag[];
  tags?: Tag[];
  experimentTags?: Tag[];
  onAddTag?: (tagId: string) => Promise<boolean>;
  onRemoveTag?: (tagId: string) => Promise<boolean>;
  onCreateTag?: (name: string, color: string) => Promise<Tag | null>;
}

const sectionConfig: Record<string, { label: string; icon: typeof Target; color: string; bgColor: string; borderColor: string; isBoolean?: boolean }> = {
  goal: { label: 'The Goal', icon: Target, color: 'text-step-input', bgColor: 'bg-step-input/10', borderColor: 'border-l-step-input' },
  mission: { label: 'The Mission', icon: Compass, color: 'text-step-input', bgColor: 'bg-step-input/10', borderColor: 'border-l-step-input' },
  example: { label: 'The Example', icon: BookOpen, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  desired: { label: 'Desired', icon: Sparkles, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  rules: { label: 'Rules', icon: ScrollText, color: 'text-step-context', bgColor: 'bg-step-context/10', borderColor: 'border-l-step-context' },
  use_websearch: { label: 'Web Search', icon: Globe, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-l-blue-500', isBoolean: true },
  board_name: { label: 'Board Name', icon: Layout, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  board_full_context: { label: 'Board Full Context', icon: Database, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  board_pulled_context: { label: 'Board Pulled Context', icon: Database, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  search_terms: { label: 'Search Terms', icon: Search, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  search_context: { label: 'Search Context', icon: Search, color: 'text-step-prompt', bgColor: 'bg-step-prompt/10', borderColor: 'border-l-step-prompt' },
  agentic_prompt: { label: 'The Agentic Prompt', icon: Brain, color: 'text-step-output', bgColor: 'bg-step-output/10', borderColor: 'border-l-step-output' },
  output: { label: 'The Output', icon: FileOutput, color: 'text-step-output', bgColor: 'bg-step-output/10', borderColor: 'border-l-step-output' },
};

export function ExperimentDetail({ 
  experiment,
  experiments = [],
  onBack, 
  onEdit, 
  onDelete, 
  onUpdate,
  onNavigateToExperiment,
  getTagsForExperiment,
  tags = [],
  experimentTags = [],
  onAddTag,
  onRemoveTag,
  onCreateTag
}: ExperimentDetailProps) {
  const { toast } = useToast();
  const [copiedRequestId, setCopiedRequestId] = useState(false);
  const [isListPanelCollapsed, setIsListPanelCollapsed] = useState(() => {
    const stored = localStorage.getItem('experiment-list-panel-collapsed');
    return stored ? JSON.parse(stored) : false;
  });
  
  useEffect(() => {
    localStorage.setItem('experiment-list-panel-collapsed', JSON.stringify(isListPanelCollapsed));
  }, [isListPanelCollapsed]);
  
  const {
    annotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationsForField,
  } = useAnnotations(experiment.id);

  const {
    sections,
    toggleSection,
    moveSection,
    reorderWithinColumn,
    resetLayout,
    getLeftColumnSections,
    getRightColumnSections,
  } = useExperimentLayout();

  const copyRequestId = async () => {
    if (experiment.request_id) {
      await navigator.clipboard.writeText(experiment.request_id);
      setCopiedRequestId(true);
      toast({ title: 'Copied!', description: 'Request ID copied to clipboard' });
      setTimeout(() => setCopiedRequestId(false), 2000);
    }
  };

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

  const renderFlowSection = useCallback((sectionKey: string) => {
    const config = sectionConfig[sectionKey];
    if (!config) return null;

    const Icon = config.icon;
    const rawContent = experiment[sectionKey as keyof Experiment];
    const content = config.isBoolean ? String(rawContent) : rawContent as string;
    
    // Skip empty string sections but always show boolean sections
    if (!config.isBoolean && !content) return null;

    const fieldAnnotations = config.isBoolean ? [] : getAnnotationsForField(sectionKey);
    const contentIsJson = !config.isBoolean && isJson(content);
    
    return (
      <Card className={cn("glass-card border-l-4", config.borderColor)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>
            <span>{config.label}</span>
            {fieldAnnotations.length > 0 && (
              <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {fieldAnnotations.length} note{fieldAnnotations.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {config.isBoolean ? (
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              rawContent ? "bg-blue-500/10 text-blue-500" : "bg-muted text-muted-foreground"
            )}>
              <Globe className="w-4 h-4" />
              {rawContent ? "Enabled" : "Disabled"}
            </div>
          ) : contentIsJson ? (
            <AnnotatableJson
              content={content}
              fieldName={sectionKey}
              experimentId={experiment.id}
              annotations={fieldAnnotations}
              onCreateAnnotation={createAnnotation}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={deleteAnnotation}
            />
          ) : (
            <AnnotatableText
              content={content}
              fieldName={sectionKey}
              experimentId={experiment.id}
              annotations={fieldAnnotations}
              onCreateAnnotation={createAnnotation}
              onUpdateAnnotation={updateAnnotation}
              onDeleteAnnotation={deleteAnnotation}
            />
          )}
        </CardContent>
      </Card>
    );
  }, [experiment, getAnnotationsForField, createAnnotation, updateAnnotation, deleteAnnotation]);

  const renderSection = useCallback((sectionId: string, column: 'left' | 'right') => {
    let content: React.ReactNode = null;

    switch (sectionId) {
      case 'tags':
        if (onAddTag && onRemoveTag && onCreateTag) {
          content = (
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
          );
        }
        break;

      case 'request_id':
        if (experiment.request_id) {
          content = (
            <Card className="glass-card border-l-4 border-l-violet-500/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Link className="w-4 h-4 text-violet-500" />
                  </div>
                  <span>Request ID</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-violet-500/10 text-violet-400 px-4 py-2 rounded-lg font-mono text-sm break-all">
                    {experiment.request_id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyRequestId}
                    className="shrink-0"
                  >
                    {copiedRequestId ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This experiment was created via the automation webhook
                </p>
              </CardContent>
            </Card>
          );
        }
        break;

      case 'annotations':
        if (annotations.length > 0) {
          content = (
            <AnnotationsSummary
              annotations={annotations}
              onDelete={deleteAnnotation}
            />
          );
        }
        break;

      case 'ai_evaluation':
        content = (
          <AIEvaluation
            prompt={experiment.agentic_prompt}
            output={experiment.output}
            context={experiment.board_pulled_context}
            onEvaluationComplete={handleEvaluationComplete}
          />
        );
        break;

      case 'notes':
        if (experiment.notes) {
          content = (
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
          );
        }
        break;

      default:
        // Handle flow sections (goal, mission, etc.)
        if (sectionConfig[sectionId]) {
          content = renderFlowSection(sectionId);
        }
        break;
    }

    if (!content) return null;

    return (
      <DraggableSection
        key={sectionId}
        id={sectionId}
        onHide={() => toggleSection(sectionId)}
      >
        {content}
      </DraggableSection>
    );
  }, [
    experiment, 
    tags, 
    experimentTags, 
    onAddTag, 
    onRemoveTag, 
    onCreateTag, 
    annotations, 
    copiedRequestId, 
    copyRequestId, 
    deleteAnnotation, 
    renderFlowSection, 
    toggleSection, 
    handleEvaluationComplete
  ]);

  const leftSections = getLeftColumnSections();
  const rightSections = getRightColumnSections();

  const showListPanel = experiments.length > 0 && onNavigateToExperiment && getTagsForExperiment;

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* Experiment List Panel */}
      {showListPanel && (
        <ExperimentListPanel
          experiments={experiments}
          currentExperimentId={experiment.id}
          onSelectExperiment={onNavigateToExperiment}
          getTagsForExperiment={getTagsForExperiment}
          isCollapsed={isListPanelCollapsed}
          onToggleCollapse={() => setIsListPanelCollapsed(!isListPanelCollapsed)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{experiment.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                {experiment.profile && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={experiment.profile.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {experiment.profile.display_name?.[0]?.toUpperCase() || experiment.profile.email?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>Ran by <span className="font-medium text-foreground">{experiment.profile.display_name || experiment.profile.email?.split('@')[0] || 'Unknown'}</span></span>
                  </div>
                )}
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
                {experiment.use_websearch && (
                  <div className="flex items-center gap-1.5 text-blue-500">
                    <Globe className="w-4 h-4" />
                    <span>Web Search</span>
                  </div>
                )}
                {experiment.request_id && (
                  <div className="flex items-center gap-1.5">
                    <Link className="w-4 h-4 text-violet-500" />
                    <button 
                      onClick={copyRequestId}
                      className="flex items-center gap-1.5 text-violet-500 hover:text-violet-400 transition-colors font-mono text-xs bg-violet-500/10 px-2 py-0.5 rounded"
                    >
                      <span>{experiment.request_id.slice(0, 8)}...</span>
                      {copiedRequestId ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LayoutToolbar
              sections={sections}
              onToggleSection={toggleSection}
              onResetLayout={resetLayout}
              onMoveSection={moveSection}
            />
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

        {/* Two-Column Canvas */}
        <ExperimentCanvas
          leftColumnIds={leftSections.map(s => s.id)}
          rightColumnIds={rightSections.map(s => s.id)}
          renderSection={renderSection}
          onMoveSection={moveSection}
          onReorderWithinColumn={reorderWithinColumn}
        />
      </div>
    </div>
  );
}
