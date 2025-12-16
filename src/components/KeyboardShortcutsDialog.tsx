import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface ShortcutItem {
  key: string;
  description: string;
  category: string;
  ctrl?: boolean;
  shift?: boolean;
}

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: ShortcutItem[];
}

export function KeyboardShortcutsDialog({ open, onOpenChange, shortcuts }: KeyboardShortcutsDialogProps) {
  const categories = [...new Set(shortcuts.map(s => s.category))];

  const formatKey = (shortcut: ShortcutItem) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('⌘/Ctrl');
    if (shortcut.shift) parts.push('⇧');
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
              <div className="space-y-1">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">?</kbd> anytime to show this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
