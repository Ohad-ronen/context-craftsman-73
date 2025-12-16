import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutGrid, 
  Table2, 
  GitCompareArrows, 
  Brain,
  Swords,
  Bot, 
  Keyboard,
  Layers,
  Sun,
  Moon,
  User
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
import { TriggerWorkflowForm } from '@/components/TriggerWorkflowForm';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table' | 'dashboard' | 'compare' | 'insights' | 'battle';

interface AppSidebarProps {
  experimentCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenShortcuts?: () => void;
  onOpenBulkEval?: () => void;
  unratedCount?: number;
}

const viewItems = [
  { id: 'dashboard' as ViewMode, title: 'Dashboard', icon: BarChart3 },
  { id: 'cards' as ViewMode, title: 'Cards', icon: LayoutGrid },
  { id: 'table' as ViewMode, title: 'Table', icon: Table2 },
  { id: 'compare' as ViewMode, title: 'Compare', icon: GitCompareArrows },
  { id: 'insights' as ViewMode, title: 'AI Insights', icon: Brain },
  { id: 'battle' as ViewMode, title: 'Output Battle', icon: Swords },
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
  onOpenShortcuts,
  onOpenBulkEval,
  unratedCount = 0,
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
        <SidebarGroup className="p-3" data-tour="trigger-workflow">
          <TriggerWorkflowForm />
        </SidebarGroup>

        <SidebarSeparator />

        {/* Views */}
        <SidebarGroup data-tour="view-modes">
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
        <SidebarGroup data-tour="ai-tools">
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50 space-y-1">
        <SidebarMenuButton 
          onClick={() => window.location.href = '/profile'}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <User className="w-4 h-4" />
          <span>Profile Settings</span>
        </SidebarMenuButton>
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
    </Sidebar>
  );
}
