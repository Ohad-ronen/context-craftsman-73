import { useNavigate } from 'react-router-dom';
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
  LogOut
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

function ThemeToggleMenuItem() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
      {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
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

      <SidebarContent>
        {/* Primary Action */}
        <SidebarGroup className="p-3" data-tour="trigger-workflow">
          <TriggerWorkflowForm />
        </SidebarGroup>

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

      <SidebarFooter className="p-3 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeToggleMenuItem />
            <DropdownMenuSeparator />
            {onOpenShortcuts && (
              <DropdownMenuItem onClick={onOpenShortcuts}>
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
              className="text-destructive focus:text-destructive"
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
