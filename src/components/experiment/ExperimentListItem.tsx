import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { TagBadge } from '@/components/TagBadge';

interface ExperimentListItemProps {
  experiment: Experiment;
  isActive: boolean;
  tags?: Tag[];
  onClick: () => void;
}

export function ExperimentListItem({ experiment, isActive, tags = [], onClick }: ExperimentListItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all duration-200",
        "hover:bg-muted/50 hover:border-border",
        isActive 
          ? "bg-primary/10 border-primary/50 border-l-2 border-l-primary" 
          : "bg-background/50 border-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className={cn(
          "font-medium text-sm line-clamp-1",
          isActive && "text-primary"
        )}>
          {experiment.name}
        </h4>
        {experiment.rating && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Star className="w-3 h-3 text-step-prompt fill-step-prompt" />
            <span className="text-xs text-muted-foreground">{experiment.rating}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{formatDistanceToNow(new Date(experiment.created_at), { addSuffix: true })}</span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 2).map(tag => (
            <TagBadge 
              key={tag.id} 
              name={tag.name}
              color={tag.color}
              size="sm"
              className="text-[10px] px-1.5 py-0"
            />
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{tags.length - 2}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
