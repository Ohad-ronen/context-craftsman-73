import { supabase } from '@/integrations/supabase/client';
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
  User,
  Settings,
  LogOut,
  ListTodo
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
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { TriggerWorkflowForm } from '@/components/TriggerWorkflowForm';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'cards' | 'table' | 'dashboard' | 'compare' | 'insights' | 'battle' | 'tasks';

interface AppSidebarProps {
  experimentCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenShortcuts?: () => void;
  onOpenBulkEval?: () => void;
  unratedCount?: number;
  pendingTaskCount?: number;
}

// Icon animation classes mapped by view id
const iconAnimationClasses: Record<string, string> = {
  dashboard: 'group-hover:animate-icon-bars-grow',
  cards: 'group-hover:scale-110',
  table: 'group-hover:scale-x-110',
  compare: 'group-hover:animate-arrows-swap',
  insights: 'group-hover:animate-brain-think',
  battle: 'group-hover:animate-swords-clash',
};

const viewItems = [
  { id: 'dashboard' as ViewMode, title: 'Dashboard', icon: BarChart3 },
  { id: 'cards' as ViewMode, title: 'Cards', icon: LayoutGrid },
  { id: 'table' as ViewMode, title: 'Table', icon: Table2 },
  { id: 'compare' as ViewMode, title: 'Compare', icon: GitCompareArrows },
  { id: 'insights' as ViewMode, title: 'AI Insights', icon: Brain },
  { id: 'battle' as ViewMode, title: 'Output Battle', icon: Swords },
];

function ThemeToggleMenuItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
      <span className={cn(
        "transition-transform duration-300",
        isDark ? "rotate-0" : "rotate-180"
      )}>
        {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
      </span>
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </DropdownMenuItem>
  );
}

export function AppSidebar({
  experimentCount,
  viewMode,
  onViewModeChange,
  onOpenShortcuts,
  onOpenBulkEval,
  unratedCount = 0,
  pendingTaskCount = 0,
}: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 group hover-lift cursor-default">
          <div className="p-2 rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
            <Layers className="w-5 h-5 text-primary transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div>
            <h1 className="text-base font-bold">Agent Tracker</h1>
            <p className="text-xs text-muted-foreground">
              {experimentCount} experiment{experimentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary Action */}
        <SidebarGroup className="p-3" data-tour="trigger-workflow">
          <TriggerWorkflowForm />
        </SidebarGroup>

        {/* Views */}
        <SidebarGroup data-tour="view-modes">
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="stagger-children">
              {viewItems.map((item) => (
                <SidebarMenuItem key={item.id} className="relative">
                  {/* Active indicator bar */}
                  {viewMode === item.id && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full animate-slide-in-left origin-left" />
                  )}
                  <SidebarMenuButton
                    onClick={() => onViewModeChange(item.id)}
                    isActive={viewMode === item.id}
                    className={cn(
                      "group transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
                      viewMode === item.id && "bg-primary/10 text-primary animate-scale-in"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-all duration-200",
                      iconAnimationClasses[item.id],
                      viewMode === item.id && "text-primary animate-bounce-in"
                    )} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup data-tour="ai-tools">
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {onOpenBulkEval && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={onOpenBulkEval}
                    className="group transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    <Bot className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                    <span>Bulk Evaluate</span>
                    {unratedCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-auto h-5 px-1.5 text-xs bg-amber-500/20 text-amber-400 border-amber-500/30",
                          "animate-pulse-soft"
                        )}
                      >
                        {unratedCount}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem className="relative">
                {viewMode === 'tasks' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full animate-slide-in-left origin-left" />
                )}
                <SidebarMenuButton
                  onClick={() => onViewModeChange('tasks')}
                  isActive={viewMode === 'tasks'}
                  className={cn(
                    "group transition-all duration-200 hover:-translate-y-0.5 active:scale-95",
                    viewMode === 'tasks' && 'bg-primary/10 text-primary animate-scale-in'
                  )}
                >
                  <ListTodo className={cn(
                    "w-4 h-4 transition-all duration-200 group-hover:scale-110",
                    viewMode === 'tasks' && "text-primary animate-bounce-in"
                  )} />
                  <span>Task Manager</span>
                  {pendingTaskCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "ml-auto h-5 px-1.5 text-xs bg-blue-500/20 text-blue-400 border-blue-500/30",
                        "animate-float"
                      )}
                    >
                      {pendingTaskCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="group w-full justify-start text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-y-0.5 active:scale-95">
              <Settings className="w-4 h-4 transition-transform duration-500 group-hover:animate-spin-slow" />
              <span>Settings</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 animate-scale-in">
            <DropdownMenuItem 
              onClick={() => window.location.href = '/profile'}
              className="transition-all duration-150 hover:translate-x-1"
            >
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeToggleMenuItem />
            <DropdownMenuSeparator />
            {onOpenShortcuts && (
              <DropdownMenuItem 
                onClick={onOpenShortcuts}
                className="transition-all duration-150 hover:translate-x-1"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/auth';
              }}
              className="text-destructive focus:text-destructive transition-all duration-150 hover:translate-x-1"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
