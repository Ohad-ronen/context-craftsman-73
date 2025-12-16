import { Tag } from '@/hooks/useTags';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagFilterProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function TagFilter({ 
  availableTags, 
  selectedTagIds, 
  onToggleTag, 
  onClearAll,
  className 
}: TagFilterProps) {
  const selectedTags = availableTags.filter(t => selectedTagIds.includes(t.id));
  
  if (availableTags.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {selectedTagIds.length > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                {selectedTagIds.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-popover border-border" align="end">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Filter by Tags</p>
              {selectedTagIds.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll}
                  className="h-6 px-2 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id)}
                    className={cn(
                      "transition-all",
                      isSelected ? "scale-105" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <TagBadge 
                      name={tag.name} 
                      color={tag.color}
                      className={isSelected ? "ring-2 ring-primary" : ""}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Active filters display */}
      {selectedTags.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          {selectedTags.slice(0, 3).map(tag => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => onToggleTag(tag.id)}
            />
          ))}
          {selectedTags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{selectedTags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
