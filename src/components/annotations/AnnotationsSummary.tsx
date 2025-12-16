import { Annotation } from '@/hooks/useAnnotations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AnnotationsSummaryProps {
  annotations: Annotation[];
  onDelete: (id: string) => Promise<boolean>;
  onScrollTo?: (annotationId: string) => void;
}

const fieldLabels: Record<string, string> = {
  goal: 'The Goal',
  mission: 'The Mission',
  example: 'The Example',
  desired: 'Desired',
  rules: 'Rules',
  board_name: 'Board Name',
  board_full_context: 'Board Full Context',
  board_pulled_context: 'Board Pulled Context',
  search_terms: 'Search Terms',
  search_context: 'Search Context',
  agentic_prompt: 'The Agentic Prompt',
  output: 'The Output',
};

export function AnnotationsSummary({
  annotations,
  onDelete,
  onScrollTo,
}: AnnotationsSummaryProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (annotations.length === 0) return null;

  // Group annotations by field
  const groupedAnnotations = annotations.reduce((acc, annotation) => {
    if (!acc[annotation.field_name]) {
      acc[annotation.field_name] = [];
    }
    acc[annotation.field_name].push(annotation);
    return acc;
  }, {} as Record<string, Annotation[]>);

  const handleScrollTo = (annotationId: string) => {
    const element = document.querySelector(`[data-annotation-id="${annotationId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Flash the highlight
      element.classList.add('ring-2', 'ring-amber-500');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-amber-500');
      }, 2000);
    }
    onScrollTo?.(annotationId);
  };

  return (
    <Card className="glass-card border-l-4 border-l-amber-500/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                </div>
                <span>Annotations</span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({annotations.length})
                </span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {Object.entries(groupedAnnotations).map(([fieldName, fieldAnnotations]) => (
              <div key={fieldName} className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {fieldLabels[fieldName] || fieldName}
                </h4>
                <div className="space-y-2">
                  {fieldAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className={cn(
                        "group flex items-start gap-3 p-2 rounded-lg",
                        "bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      )}
                      onClick={() => handleScrollTo(annotation.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-600 dark:text-amber-400 truncate mb-1">
                          "{annotation.highlighted_text}"
                        </p>
                        <p className="text-sm line-clamp-2">{annotation.note}</p>
                        {annotation.profile && (
                          <p className="text-xs text-muted-foreground mt-1">
                            by {annotation.profile.display_name || annotation.profile.email || 'Unknown'}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(annotation.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
