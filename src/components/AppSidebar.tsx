import { useState } from 'react';
import { 
  BarChart3, 
  LayoutGrid, 
  Table2, 
  GitCompareArrows, 
  Brain, 
  Bot, 
  Keyboard,
  Layers,
  Tag,
  Trash2,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
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
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TriggerWorkflowForm } from '@/components/TriggerWorkflowForm';
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
  onDeleteTag?: (tagId: string) => Promise<boolean>;
}

const viewItems = [
  { id: 'dashboard' as ViewMode, title: 'Dashboard', icon: BarChart3 },
  { id: 'cards' as ViewMode, title: 'Cards', icon: LayoutGrid },
  { id: 'table' as ViewMode, title: 'Table', icon: Table2 },
  { id: 'compare' as ViewMode, title: 'Compare', icon: GitCompareArrows },
];

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <SidebarMenuButton 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full justify-start text-muted-foreground hover:text-foreground"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </SidebarMenuButton>
  );
}

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
  onDeleteTag,
}: AppSidebarProps) {
  const [manageMode, setManageMode] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);

  const handleDeleteTag = async () => {
    if (tagToDelete && onDeleteTag) {
      await onDeleteTag(tagToDelete.id);
      setTagToDelete(null);
    }
  };
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
            <SidebarGroupLabel className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Filter by Tags
              </div>
              {onDeleteTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-xs"
                  onClick={() => setManageMode(!manageMode)}
                >
                  <Settings className="w-3 h-3 mr-1" />
                  {manageMode ? 'Done' : 'Manage'}
                </Button>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <div key={tag.id} className="relative group">
                    <button
                      onClick={() => !manageMode && onToggleTag(tag.id)}
                      disabled={manageMode}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium transition-all",
                        "border",
                        manageMode 
                          ? "cursor-default opacity-80"
                          : "hover:scale-105",
                        selectedTagIds.includes(tag.id) && !manageMode
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border"
                      )}
                      style={
                        selectedTagIds.includes(tag.id) && !manageMode
                          ? {}
                          : { borderColor: tag.color + '40', backgroundColor: tag.color + '15' }
                      }
                    >
                      {tag.name}
                    </button>
                    {manageMode && (
                      <button
                        onClick={() => setTagToDelete(tag)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {selectedTagIds.length > 0 && !manageMode && (
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

      <SidebarFooter className="p-3 border-t border-border/50 space-y-1">
        <ThemeToggleButton />
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

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag "{tagToDelete?.name}"? This will remove it from all experiments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
