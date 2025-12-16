import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MessageSquarePlus } from 'lucide-react';
import { MentionInput } from './MentionInput';

interface AnnotationPopoverProps {
  selectedText: string;
  onSave: (note: string) => void;
  onCancel: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnotationPopover({
  selectedText,
  onSave,
  onCancel,
  isOpen,
  onOpenChange,
}: AnnotationPopoverProps) {
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (note.trim()) {
      onSave(note.trim());
      setNote('');
    }
  };

  const handleCancel = () => {
    setNote('');
    onCancel();
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 gap-1.5 text-xs shadow-lg"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Add Note
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Selected text:</p>
            <p className="text-sm bg-muted/50 p-2 rounded border border-border/50 line-clamp-2">
              "{selectedText}"
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Your note: <span className="text-muted-foreground/60">(use @ to mention users)</span>
            </label>
            <MentionInput
              value={note}
              onChange={setNote}
              placeholder="Add your observation or insight... Use @ to mention someone"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!note.trim()}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
