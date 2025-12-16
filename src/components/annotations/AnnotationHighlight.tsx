import { useState, forwardRef } from 'react';
import { Annotation } from '@/hooks/useAnnotations';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  HoverCardPortal,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionInput } from './MentionInput';
import { MentionText } from './MentionText';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { extractMentionedUsers } from '@/lib/mentions';
import { createMentionNotification } from '@/hooks/useNotifications';

interface AnnotationHighlightProps {
  annotation: Annotation;
  children: React.ReactNode;
  onUpdate: (id: string, note: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

// ForwardRef wrapper for the mark element
const HighlightMark = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { 'data-annotation-id': string }
>(({ children, className, ...props }, ref) => (
  <mark ref={ref} className={className} {...props}>
    {children}
  </mark>
));
HighlightMark.displayName = 'HighlightMark';

export function AnnotationHighlight({
  annotation,
  children,
  onUpdate,
  onDelete,
}: AnnotationHighlightProps) {
  const { user } = useAuth();
  const { profiles } = useProfiles();
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(annotation.note);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveEdit = async () => {
    if (editNote.trim() && editNote !== annotation.note) {
      const success = await onUpdate(annotation.id, editNote.trim());
      
      // Check for new mentions and create notifications
      if (success && user) {
        const oldMentions = extractMentionedUsers(annotation.note, profiles);
        const newMentions = extractMentionedUsers(editNote, profiles);
        
        // Find newly mentioned users (not in old mentions)
        const newlyMentioned = newMentions.filter(
          (newUser) => !oldMentions.some((oldUser) => oldUser.id === newUser.id)
        );
        
        for (const mentionedUser of newlyMentioned) {
          if (mentionedUser.id !== user.id) {
            await createMentionNotification({
              mentionedUserId: mentionedUser.id,
              fromUserId: user.id,
              experimentId: annotation.experiment_id,
              annotationId: annotation.id,
              highlightedText: annotation.highlighted_text,
            });
          }
        }
      }
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
        <HighlightMark
          className={cn(
            "bg-amber-400/30 dark:bg-amber-500/25 px-0.5 rounded-sm cursor-pointer",
            "hover:bg-amber-400/50 dark:hover:bg-amber-500/40 transition-colors",
            "border-b-2 border-amber-500/50"
          )}
          data-annotation-id={annotation.id}
        >
          {children}
        </HighlightMark>
      </HoverCardTrigger>
      <HoverCardPortal>
        <HoverCardContent 
          className="w-80 p-3 z-[9999] bg-popover border border-border shadow-xl" 
          align="start" 
          sideOffset={8}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              {isEditing ? (
                <MentionInput
                  value={editNote}
                  onChange={setEditNote}
                  className="min-h-[60px]"
                  autoFocus
                />
              ) : (
                <MentionText text={annotation.note} className="text-sm leading-relaxed" />
              )}
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div className="flex flex-col gap-0.5">
                {annotation.profile && (
                  <span className="text-xs font-medium text-foreground/80">
                    {annotation.profile.display_name || annotation.profile.email || 'Unknown'}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(annotation.created_at).toLocaleDateString()}
                </span>
              </div>
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
      </HoverCardPortal>
    </HoverCard>
  );
}
