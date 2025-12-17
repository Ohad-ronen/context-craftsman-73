import { useState, useMemo } from 'react';
import { Experiment } from '@/hooks/useExperiments';
import { Tag } from '@/hooks/useTags';
import { TagBadge } from '@/components/TagBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Eye, Star, Filter, X, Tags, Layout, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ExperimentsTableProps {
  experiments: Experiment[];
  onViewExperiment: (id: string) => void;
  getTagsForExperiment?: (experimentId: string) => Tag[];
  availableTags?: Tag[];
}

type SortField = 'name' | 'rating' | 'created_at' | 'updated_at' | 'board_name';
type SortDirection = 'asc' | 'desc';

export function ExperimentsTable({ experiments, onViewExperiment, getTagsForExperiment, availableTags = [] }: ExperimentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [webSearchFilter, setWebSearchFilter] = useState<string>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get unique goals from experiments
  const uniqueGoals = useMemo(() => {
    const goals = new Set<string>();
    experiments.forEach(exp => {
      if (exp.goal && exp.goal.trim()) {
        // Truncate long goals for display
        const truncated = exp.goal.length > 50 ? exp.goal.substring(0, 50) + '...' : exp.goal;
        goals.add(truncated);
      }
    });
    return Array.from(goals).sort();
  }, [experiments]);

  // Get unique board names from experiments
  const uniqueBoards = useMemo(() => {
    const boards = new Set<string>();
    experiments.forEach(exp => {
      if (exp.board_name && exp.board_name.trim()) {
        boards.add(exp.board_name);
      }
    });
    return Array.from(boards).sort();
  }, [experiments]);

  // Map truncated goals back to full goals for filtering
  const goalMap = useMemo(() => {
    const map = new Map<string, string>();
    experiments.forEach(exp => {
      if (exp.goal && exp.goal.trim()) {
        const truncated = exp.goal.length > 50 ? exp.goal.substring(0, 50) + '...' : exp.goal;
        map.set(truncated, exp.goal);
      }
    });
    return map;
  }, [experiments]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setRatingFilter('all');
    setGoalFilter('all');
    setBoardFilter('all');
    setWebSearchFilter('all');
    setSelectedTagIds([]);
  };

  const hasActiveFilters = searchQuery || ratingFilter !== 'all' || goalFilter !== 'all' || boardFilter !== 'all' || webSearchFilter !== 'all' || selectedTagIds.length > 0;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-primary" />
      : <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  const filteredAndSortedExperiments = useMemo(() => {
    let result = [...experiments];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(exp => 
        exp.name.toLowerCase().includes(query) ||
        exp.goal.toLowerCase().includes(query) ||
        exp.mission.toLowerCase().includes(query) ||
        exp.output.toLowerCase().includes(query) ||
        exp.agentic_prompt.toLowerCase().includes(query) ||
        exp.board_name.toLowerCase().includes(query)
      );
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'unrated') {
        result = result.filter(exp => !exp.rating);
      } else {
        const rating = parseInt(ratingFilter);
        result = result.filter(exp => exp.rating === rating);
      }
    }

    // Apply goal filter
    if (goalFilter !== 'all') {
      const fullGoal = goalMap.get(goalFilter) || goalFilter;
      result = result.filter(exp => exp.goal === fullGoal);
    }

    // Apply board filter
    if (boardFilter !== 'all') {
      result = result.filter(exp => exp.board_name === boardFilter);
    }

    // Apply web search filter
    if (webSearchFilter !== 'all') {
      if (webSearchFilter === 'enabled') {
        result = result.filter(exp => exp.use_websearch === true);
      } else {
        result = result.filter(exp => exp.use_websearch !== true);
      }
    }

    // Apply tag filter
    if (selectedTagIds.length > 0 && getTagsForExperiment) {
      result = result.filter(exp => {
        const expTags = getTagsForExperiment(exp.id);
        return selectedTagIds.some(tagId => expTags.some(t => t.id === tagId));
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'board_name':
          comparison = a.board_name.localeCompare(b.board_name);
          break;
        case 'rating':
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          comparison = ratingA - ratingB;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [experiments, searchQuery, ratingFilter, goalFilter, boardFilter, webSearchFilter, selectedTagIds, sortField, sortDirection, goalMap, getTagsForExperiment]);

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const selectedTags = availableTags.filter(t => selectedTagIds.includes(t.id));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[130px]">
            <Star className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="unrated">Unrated</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
          </SelectContent>
        </Select>

        {uniqueGoals.length > 0 && (
          <Select value={goalFilter} onValueChange={setGoalFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Goals</SelectItem>
              {uniqueGoals.map(goal => (
                <SelectItem key={goal} value={goal}>
                  {goal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {uniqueBoards.length > 0 && (
          <Select value={boardFilter} onValueChange={setBoardFilter}>
            <SelectTrigger className="w-[160px]">
              <Layout className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Board" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Boards</SelectItem>
              {uniqueBoards.map(board => (
                <SelectItem key={board} value={board}>
                  {board.length > 20 ? board.substring(0, 20) + '...' : board}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={webSearchFilter} onValueChange={setWebSearchFilter}>
          <SelectTrigger className="w-[150px]">
            <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Web Search" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="enabled">Web Search</SelectItem>
            <SelectItem value="disabled">No Web Search</SelectItem>
          </SelectContent>
        </Select>

        {availableTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <Tags className="w-4 h-4" />
                Tags
                {selectedTagIds.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                    {selectedTagIds.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-popover border-border" align="start">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Filter by Tags</p>
                  {selectedTagIds.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedTagIds([])}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleToggleTag(tag.id)}
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
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-muted-foreground">
            <X className="w-4 h-4" />
            Clear filters
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredAndSortedExperiments.length} of {experiments.length} experiments
        </span>
      </div>

      {/* Active Tag Filters */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Filtered by tags:</span>
          {selectedTags.map(tag => (
            <TagBadge
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => handleToggleTag(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Tags</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('board_name')}
              >
                <div className="flex items-center">
                  Board
                  <SortIcon field="board_name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center">
                  Rating
                  <SortIcon field="rating" />
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Output Preview</TableHead>
              <TableHead 
                className="cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedExperiments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No experiments found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedExperiments.map((experiment) => {
                const tags = getTagsForExperiment?.(experiment.id) || [];
                return (
                  <TableRow 
                    key={experiment.id}
                    className="cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => onViewExperiment(experiment.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold">{experiment.name}</div>
                          {experiment.goal && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {truncateText(experiment.goal, 40)}
                            </div>
                          )}
                        </div>
                        {experiment.use_websearch && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 shrink-0">
                                <Globe className="w-3 h-3" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Web search enabled</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {tags.slice(0, 2).map(tag => (
                          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                        {tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{tags.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {truncateText(experiment.board_name, 20) || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {experiment.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-step-prompt fill-step-prompt" />
                          <span>{experiment.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm text-muted-foreground font-mono max-w-[200px]">
                        {truncateText(experiment.output, 60) || <span className="italic">No output</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                      {format(new Date(experiment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewExperiment(experiment.id);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
