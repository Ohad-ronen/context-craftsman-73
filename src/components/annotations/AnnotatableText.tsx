import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Annotation, CreateAnnotationData } from '@/hooks/useAnnotations';
import { AnnotationPopover } from './AnnotationPopover';
import { AnnotationHighlight } from './AnnotationHighlight';
import { createPortal } from 'react-dom';

interface AnnotatableTextProps {
  content: string;
  fieldName: string;
  experimentId: string;
  annotations: Annotation[];
  onCreateAnnotation: (data: CreateAnnotationData) => Promise<Annotation | null>;
  onUpdateAnnotation: (id: string, note: string) => Promise<boolean>;
  onDeleteAnnotation: (id: string) => Promise<boolean>;
}

interface SelectionState {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

export function AnnotatableText({
  content,
  fieldName,
  experimentId,
  annotations,
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: AnnotatableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Sort annotations by start offset for proper rendering
  const sortedAnnotations = useMemo(() => 
    [...annotations].sort((a, b) => a.start_offset - b.start_offset),
    [annotations]
  );

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    const range = sel.getRangeAt(0);
    
    // Check if selection is within our container
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Calculate offset within the plain text content
    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(containerRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + selectedText.length;

    // Check for overlap with existing annotations
    const hasOverlap = sortedAnnotations.some(
      a => (startOffset < a.end_offset && endOffset > a.start_offset)
    );

    if (hasOverlap) {
      sel.removeAllRanges();
      return;
    }

    const rect = range.getBoundingClientRect();
    setSelection({
      text: selectedText,
      startOffset,
      endOffset,
      rect,
    });
    setIsPopoverOpen(true);
  }, [sortedAnnotations]);

  const handleSaveAnnotation = async (note: string) => {
    if (!selection) return;

    await onCreateAnnotation({
      experiment_id: experimentId,
      field_name: fieldName,
      start_offset: selection.startOffset,
      end_offset: selection.endOffset,
      highlighted_text: selection.text,
      note,
    });

    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setIsPopoverOpen(false);
  };

  const handleCancelAnnotation = () => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setIsPopoverOpen(false);
  };

  // Render content with highlighted annotations
  const renderContent = () => {
    if (sortedAnnotations.length === 0) {
      return <span>{content}</span>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedAnnotations.forEach((annotation, idx) => {
      // Add text before this annotation
      if (annotation.start_offset > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.slice(lastIndex, annotation.start_offset)}
          </span>
        );
      }

      // Add highlighted annotation
      parts.push(
        <AnnotationHighlight
          key={annotation.id}
          annotation={annotation}
          onUpdate={onUpdateAnnotation}
          onDelete={onDeleteAnnotation}
        >
          {content.slice(annotation.start_offset, annotation.end_offset)}
        </AnnotationHighlight>
      );

      lastIndex = annotation.end_offset;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">{content.slice(lastIndex)}</span>
      );
    }

    return parts;
  };

  // Handle click outside to clear selection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selection && !isPopoverOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selection, isPopoverOpen]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="text-sm text-muted-foreground whitespace-pre-wrap font-sans select-text cursor-text"
      >
        {renderContent()}
      </div>

      {/* Floating annotation button */}
      {selection && createPortal(
        <div
          style={{
            position: 'fixed',
            left: selection.rect.left + selection.rect.width / 2,
            top: selection.rect.top - 40,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <AnnotationPopover
            selectedText={selection.text}
            onSave={handleSaveAnnotation}
            onCancel={handleCancelAnnotation}
            isOpen={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
