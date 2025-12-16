import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Layers, 
  LayoutGrid, 
  Table2, 
  Brain, 
  BarChart3, 
  GitCompareArrows, 
  Keyboard, 
  Bot,
  MoreHorizontal,
  Play
} from 'lucide-react';
import { TriggerWorkflowForm } from '@/components/TriggerWorkflowForm';
import { TagFilter } from '@/components/TagFilter';
import { Tag } from '@/hooks/useTags';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HeaderProps {
  experimentCount: number;
  viewMode: 'cards' | 'table' | 'dashboard' | 'compare';
  onViewModeChange: (mode: 'cards' | 'table' | 'dashboard' | 'compare') => void;
  onOpenAnalyzer?: () => void;
  onOpenShortcuts?: () => void;
  onOpenBulkEval?: () => void;
  unratedCount?: number;
  tags?: Tag[];
  selectedTagIds?: string[];
  onToggleTag?: (tagId: string) => void;
  onClearTagFilter?: () => void;
}

export function Header({ 
  experimentCount, 
  viewMode, 
  onViewModeChange, 
  onOpenAnalyzer,
  onOpenShortcuts,
  onOpenBulkEval,
  unratedCount = 0,
  tags = [],
  selectedTagIds = [],
  onToggleTag,
  onClearTagFilter
}: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 shrink-0">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">Agent Tracker</h1>
              <p className="text-xs text-muted-foreground">
                {experimentCount} experiment{experimentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Center: View Tabs - Hidden on mobile */}
          <div className="hidden md:block">
            <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as typeof viewMode)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="cards" className="gap-1.5 text-xs">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Cards
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-1.5 text-xs">
                  <Table2 className="w-3.5 h-3.5" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="compare" className="gap-1.5 text-xs">
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  Compare
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Tag Filter */}
            {onToggleTag && onClearTagFilter && (
              <TagFilter
                availableTags={tags}
                selectedTagIds={selectedTagIds}
                onToggleTag={onToggleTag}
                onClearAll={onClearTagFilter}
              />
            )}

            {/* Primary Action: New Workflow */}
            <TriggerWorkflowForm />

            {/* Tools Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Tools</span>
                  {unratedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {unratedCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onOpenBulkEval && (
                  <DropdownMenuItem onClick={onOpenBulkEval} className="gap-2">
                    <Bot className="w-4 h-4" />
                    Bulk Evaluate
                    {unratedCount > 0 && (
                      <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                        {unratedCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                )}
                {onOpenAnalyzer && (
                  <DropdownMenuItem onClick={onOpenAnalyzer} className="gap-2">
                    <Brain className="w-4 h-4" />
                    AI Insights
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onOpenShortcuts && (
                  <DropdownMenuItem onClick={onOpenShortcuts} className="gap-2">
                    <Keyboard className="w-4 h-4" />
                    Keyboard Shortcuts
                    <kbd className="ml-auto text-[10px] bg-muted px-1 py-0.5 rounded">?</kbd>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile View Selector */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {viewMode === 'dashboard' && <BarChart3 className="w-4 h-4" />}
                    {viewMode === 'cards' && <LayoutGrid className="w-4 h-4" />}
                    {viewMode === 'table' && <Table2 className="w-4 h-4" />}
                    {viewMode === 'compare' && <GitCompareArrows className="w-4 h-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewModeChange('dashboard')} className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewModeChange('cards')} className="gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewModeChange('table')} className="gap-2">
                    <Table2 className="w-4 h-4" />
                    Table
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewModeChange('compare')} className="gap-2">
                    <GitCompareArrows className="w-4 h-4" />
                    Compare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
