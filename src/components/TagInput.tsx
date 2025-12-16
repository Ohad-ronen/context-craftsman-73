import { useState } from 'react';
import { Tag } from '@/hooks/useTags';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Tag as TagIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag | null>;
  className?: string;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
];

export function TagInput({ 
  availableTags, 
  selectedTags, 
  onAddTag, 
  onRemoveTag, 
  onCreateTag,
  className 
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const unselectedTags = availableTags.filter(
    tag => !selectedTags.some(st => st.id === tag.id)
  );

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreating(true);
    const newTag = await onCreateTag(newTagName.trim(), selectedColor);
    if (newTag) {
      onAddTag(newTag.id);
      setNewTagName('');
      setSelectedColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    }
    setIsCreating(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            onRemove={() => onRemoveTag(tag.id)}
          />
        ))}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 gap-1 text-xs">
              <Plus className="w-3 h-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-popover border-border" align="start">
            <div className="space-y-3">
              {/* Existing Tags */}
              {unselectedTags.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Existing Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {unselectedTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => {
                          onAddTag(tag.id);
                          setIsOpen(false);
                        }}
                        className="hover:scale-105 transition-transform"
                      >
                        <TagBadge name={tag.name} color={tag.color} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Create New Tag */}
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground">Create New Tag</p>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <div className="flex gap-1">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-transform",
                        selectedColor === color && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isCreating}
                  className="w-full h-7 text-xs"
                >
                  <TagIcon className="w-3 h-3 mr-1" />
                  Create Tag
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
