import { useState } from 'react';
import { Annotation, CreateAnnotationData } from '@/hooks/useAnnotations';
import { JsonViewer } from '@/components/JsonViewer';
import { AnnotatableText } from './AnnotatableText';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquarePlus } from 'lucide-react';

interface AnnotatableJsonProps {
  content: string;
  fieldName: string;
  experimentId: string;
  annotations: Annotation[];
  onCreateAnnotation: (data: CreateAnnotationData) => Promise<Annotation | null>;
  onUpdateAnnotation: (id: string, note: string) => Promise<boolean>;
  onDeleteAnnotation: (id: string) => Promise<boolean>;
}

export function AnnotatableJson({
  content,
  fieldName,
  experimentId,
  annotations,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: AnnotatableJsonProps) {
  const [mode, setMode] = useState<'view' | 'annotate'>('view');

  // Format JSON for annotation mode
  const formattedContent = (() => {
    try {
      return JSON.stringify(JSON.parse(content), null, 2);
    } catch {
      return content;
    }
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant={mode === 'view' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMode('view')}
          className="h-7 text-xs"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          View
        </Button>
        <Button
          variant={mode === 'annotate' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMode('annotate')}
          className="h-7 text-xs"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
          Annotate
          {annotations.length > 0 && (
            <span className="ml-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 rounded-full text-xs">
              {annotations.length}
            </span>
          )}
        </Button>
      </div>

      {mode === 'view' ? (
        <JsonViewer content={content} />
      ) : (
        <AnnotatableText
          content={formattedContent}
          fieldName={fieldName}
          experimentId={experimentId}
          annotations={annotations}
          onCreateAnnotation={onCreateAnnotation}
          onUpdateAnnotation={onUpdateAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
        />
      )}
    </div>
  );
}
