import { 
  BarChart3, 
  LayoutGrid, 
  Table2, 
  GitCompareArrows, 
  Brain, 
  Bot, 
  Keyboard,
  Layers,
  Play,
  Tag
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { TriggerWorkflowForm } from '@/components/TriggerWorkflowForm';
import { TagFilter } from '@/components/TagFilter';
import { Tag as TagType } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table' | 'dashboard' | 'compare';

interface AppSidebarProps {
  experimentCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAnalyzer?: () => void;
  onOpenShortcuts?: () => void;
  onOpenBulkEval?: () => void;
  unratedCount?: number;
  tags?: TagType[];
  selectedTagIds?: string[];
  onToggleTag?: (tagId: string) => void;
  onClearTagFilter?: () => void;
}

const viewItems = [
  { id: 'dashboard' as ViewMode, title: 'Dashboard', icon: BarChart3 },
  { id: 'cards' as ViewMode, title: 'Cards', icon: LayoutGrid },
  { id: 'table' as ViewMode, title: 'Table', icon: Table2 },
  { id: 'compare' as ViewMode, title: 'Compare', icon: GitCompareArrows },
];

export function AppSidebar({
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
  onClearTagFilter,
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold">Agent Tracker</h1>
            <p className="text-xs text-muted-foreground">
              {experimentCount} experiment{experimentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Primary Action */}
        <SidebarGroup className="p-3">
          <TriggerWorkflowForm />
        </SidebarGroup>

        <SidebarSeparator />

        {/* Views */}
        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {viewItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onViewModeChange(item.id)}
                    isActive={viewMode === item.id}
                    className={cn(
                      "transition-colors",
                      viewMode === item.id && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* AI Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>AI Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {onOpenBulkEval && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onOpenBulkEval}>
                    <Bot className="w-4 h-4" />
                    <span>Bulk Evaluate</span>
                    {unratedCount > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                        {unratedCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {onOpenAnalyzer && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onOpenAnalyzer}>
                    <Brain className="w-4 h-4" />
                    <span>AI Insights</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Filters */}
        {onToggleTag && onClearTagFilter && tags.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              Filter by Tags
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id)}
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium transition-all",
                      "border hover:scale-105",
                      selectedTagIds.includes(tag.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                    style={
                      selectedTagIds.includes(tag.id)
                        ? {}
                        : { borderColor: tag.color + '40', backgroundColor: tag.color + '15' }
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
              {selectedTagIds.length > 0 && (
                <button
                  onClick={onClearTagFilter}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear filters
                </button>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        {onOpenShortcuts && (
          <SidebarMenuButton 
            onClick={onOpenShortcuts}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Keyboard className="w-4 h-4" />
            <span>Keyboard Shortcuts</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">?</kbd>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
