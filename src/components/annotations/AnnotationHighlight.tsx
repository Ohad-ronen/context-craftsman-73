import { useState } from 'react';
import { Annotation } from '@/hooks/useAnnotations';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnnotationHighlightProps {
  annotation: Annotation;
  children: React.ReactNode;
  onUpdate: (id: string, note: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function AnnotationHighlight({
  annotation,
  children,
  onUpdate,
  onDelete,
}: AnnotationHighlightProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(annotation.note);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEdit = async () => {
    if (editNote.trim() && editNote !== annotation.note) {
      await onUpdate(annotation.id, editNote.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(annotation.id);
    setIsDeleting(false);
  };

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <mark
          className={cn(
            "bg-amber-400/30 dark:bg-amber-500/25 px-0.5 rounded-sm cursor-pointer",
            "hover:bg-amber-400/50 dark:hover:bg-amber-500/40 transition-colors",
            "border-b-2 border-amber-500/50"
          )}
          data-annotation-id={annotation.id}
        >
          {children}
        </mark>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            {isEditing ? (
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
                autoFocus
              />
            ) : (
              <p className="text-sm leading-relaxed">{annotation.note}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground">
              {new Date(annotation.created_at).toLocaleDateString()}
            </span>
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setEditNote(annotation.note);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSaveEdit}
                    disabled={!editNote.trim()}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
