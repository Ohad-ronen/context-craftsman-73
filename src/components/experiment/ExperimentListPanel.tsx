import { useState, useMemo, useEffect, useRef } from 'react';
import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExperimentListItem } from './ExperimentListItem';
import { Search, ChevronLeft, ChevronRight, List, Star, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

interface ExperimentListPanelProps {
  experiments: Experiment[];
  currentExperimentId: string;
  onSelectExperiment: (id: string) => void;
  getTagsForExperiment: (experimentId: string) => Tag[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type RatingFilter = 'all' | 'rated' | 'unrated';

export function ExperimentListPanel({
  experiments,
  currentExperimentId,
  onSelectExperiment,
  getTagsForExperiment,
  isCollapsed,
  onToggleCollapse,
}: ExperimentListPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const activeRef = useRef<HTMLDivElement>(null);

  const filteredExperiments = useMemo(() => {
    return experiments.filter(exp => {
      const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = 
        ratingFilter === 'all' ||
        (ratingFilter === 'rated' && exp.rating !== null) ||
        (ratingFilter === 'unrated' && exp.rating === null);
      return matchesSearch && matchesRating;
    });
  }, [experiments, searchQuery, ratingFilter]);

  // Auto-scroll to active experiment when panel opens
  useEffect(() => {
    if (!isCollapsed && activeRef.current) {
      setTimeout(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isCollapsed, currentExperimentId]);

  if (isCollapsed) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="absolute top-4 -right-10 z-10 bg-background border shadow-md hover:bg-muted"
          title="Show experiment list"
        >
          <List className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 border-r bg-background/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Experiments</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-7 w-7"
            title="Hide experiment list"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Filter */}
        <ToggleGroup 
          type="single" 
          value={ratingFilter} 
          onValueChange={(v) => v && setRatingFilter(v as RatingFilter)}
          className="justify-start"
        >
          <ToggleGroupItem value="all" size="sm" className="text-xs h-7 px-2">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="rated" size="sm" className="text-xs h-7 px-2">
            <Star className="w-3 h-3 mr-1" />
            Rated
          </ToggleGroupItem>
          <ToggleGroupItem value="unrated" size="sm" className="text-xs h-7 px-2">
            <StarOff className="w-3 h-3 mr-1" />
            Unrated
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredExperiments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No experiments found
            </p>
          ) : (
            filteredExperiments.map(exp => (
              <div 
                key={exp.id} 
                ref={exp.id === currentExperimentId ? activeRef : undefined}
              >
                <ExperimentListItem
                  experiment={exp}
                  isActive={exp.id === currentExperimentId}
                  tags={getTagsForExperiment(exp.id)}
                  onClick={() => onSelectExperiment(exp.id)}
                />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t text-xs text-muted-foreground text-center">
        {filteredExperiments.length} of {experiments.length} experiments
      </div>
    </div>
  );
}
