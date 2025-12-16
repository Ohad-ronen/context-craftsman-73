import { Folder } from '@/hooks/useFolders';
import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface FolderCardProps {
  folder: Folder;
  experimentCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FolderCard({ folder, experimentCount, onClick, onEdit, onDelete }: FolderCardProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id },
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "cursor-pointer transition-all duration-300 group",
        "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
        "hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]",
        "animate-fade-in",
        isOver && "ring-2 ring-primary border-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${folder.color}20` }}
            >
              <FolderOpen
                className="w-6 h-6 transition-transform duration-300 group-hover:rotate-6"
                style={{ color: folder.color }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {folder.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {experimentCount} experiment{experimentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
