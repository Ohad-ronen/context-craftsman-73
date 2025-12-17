import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagBadge } from '@/components/TagBadge';
import { Star, Clock, FileText, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ExperimentCardProps {
  experiment: Experiment;
  tags?: Tag[];
  onClick: () => void;
}

export function ExperimentCard({ experiment, tags = [], onClick }: ExperimentCardProps) {
  return (
    <Card 
      className={cn(
        "glass-card cursor-pointer transition-all duration-300 group",
        "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
        "hover:-translate-y-2 active:translate-y-0 active:scale-[0.98]",
        "animate-fade-in"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors duration-300">
              {experiment.name}
            </CardTitle>
            {experiment.goal && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 transition-colors duration-300 group-hover:text-muted-foreground/80">
                {experiment.goal}
              </p>
            )}
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map(tag => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} />
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
            <Clock className="w-4 h-4 transition-all duration-300 group-hover:rotate-12" />
            <span>{formatDistanceToNow(new Date(experiment.updated_at), { addSuffix: true })}</span>
          </div>
          {experiment.rating && (
            <div className="flex items-center gap-1.5 transition-transform duration-300 group-hover:scale-110">
              <Star className="w-4 h-4 text-step-prompt fill-step-prompt transition-all duration-300 group-hover:rotate-12 group-hover:drop-shadow-[0_0_8px_hsl(var(--prompt-step))]" />
              <span className="font-medium">{experiment.rating}/5</span>
            </div>
          )}
          {experiment.use_websearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 transition-transform duration-300 group-hover:scale-110">
                  <Globe className="w-3.5 h-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>Web search enabled</TooltipContent>
            </Tooltip>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <FileText className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="truncate max-w-[100px]">
              {experiment.output ? experiment.output.substring(0, 30) + '...' : 'No output'}
            </span>
          </div>
        </div>
        
        {/* Flow preview with hover animations */}
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-border/50">
          <div className="w-2 h-2 rounded-full bg-step-input transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_10px_hsl(var(--input-step))]" 
               style={{ transitionDelay: '0ms' }} />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-step-input via-step-context to-step-prompt transition-all duration-500 group-hover:h-1 origin-left" />
          <div className="w-2 h-2 rounded-full bg-step-context transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_10px_hsl(var(--context-step))]"
               style={{ transitionDelay: '100ms' }} />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-step-context via-step-prompt to-step-output transition-all duration-500 group-hover:h-1" />
          <div className="w-2 h-2 rounded-full bg-step-prompt transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_10px_hsl(var(--prompt-step))]"
               style={{ transitionDelay: '200ms' }} />
          <div className="flex-1 h-0.5 bg-step-output/50 transition-all duration-500 group-hover:h-1 group-hover:bg-step-output" />
          <div className="w-2 h-2 rounded-full bg-step-output transition-all duration-300 group-hover:scale-150 group-hover:shadow-[0_0_10px_hsl(var(--output-step))]"
               style={{ transitionDelay: '300ms' }} />
        </div>
      </CardContent>
    </Card>
  );
}
