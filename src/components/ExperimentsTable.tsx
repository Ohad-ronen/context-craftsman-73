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
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Eye, Star, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ExperimentsTableProps {
  experiments: Experiment[];
  onViewExperiment: (id: string) => void;
  getTagsForExperiment?: (experimentId: string) => Tag[];
}

type SortField = 'name' | 'rating' | 'created_at' | 'updated_at' | 'board_name';
type SortDirection = 'asc' | 'desc';

export function ExperimentsTable({ experiments, onViewExperiment, getTagsForExperiment }: ExperimentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
  }, [experiments, searchQuery, ratingFilter, sortField, sortDirection]);

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[140px]">
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
        </div>

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredAndSortedExperiments.length} of {experiments.length} experiments
        </span>
      </div>

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
                      <div>
                        <div className="font-semibold">{experiment.name}</div>
                        {experiment.goal && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {truncateText(experiment.goal, 40)}
                          </div>
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
