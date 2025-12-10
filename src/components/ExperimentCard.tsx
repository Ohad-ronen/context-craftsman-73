import { Experiment } from '@/hooks/useExperiments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ExperimentCardProps {
  experiment: Experiment;
  onClick: () => void;
}

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  completed: 'bg-step-output/20 text-step-output',
  evaluating: 'bg-step-prompt/20 text-step-prompt',
};

export function ExperimentCard({ experiment, onClick }: ExperimentCardProps) {
  return (
    <Card 
      className="glass-card cursor-pointer hover:border-primary/50 transition-all duration-300 group animate-slide-up"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
              {experiment.name}
            </CardTitle>
            {experiment.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {experiment.description}
              </p>
            )}
          </div>
          <Badge className={cn("shrink-0", statusColors[experiment.status])}>
            {experiment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{formatDistanceToNow(new Date(experiment.updated_at), { addSuffix: true })}</span>
          </div>
          {experiment.rating && (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-step-prompt fill-step-prompt" />
              <span>{experiment.rating}/5</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <FileText className="w-4 h-4" />
            <span className="truncate max-w-[100px]">
              {experiment.output.substring(0, 30)}...
            </span>
          </div>
        </div>
        
        {/* Flow preview */}
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-border/50">
          <div className="w-2 h-2 rounded-full bg-step-input" />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-step-input via-step-context to-step-prompt" />
          <div className="w-2 h-2 rounded-full bg-step-context" />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-step-context via-step-prompt to-step-output" />
          <div className="w-2 h-2 rounded-full bg-step-prompt" />
          <div className="flex-1 h-0.5 bg-step-output/50" />
          <div className="w-2 h-2 rounded-full bg-step-output" />
        </div>
      </CardContent>
    </Card>
  );
}
