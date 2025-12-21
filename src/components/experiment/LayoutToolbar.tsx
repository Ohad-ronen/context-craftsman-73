import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, RotateCcw, Eye, EyeOff, Columns } from 'lucide-react';
import { LayoutSection } from '@/hooks/useExperimentLayout';

interface LayoutToolbarProps {
  sections: LayoutSection[];
  onToggleSection: (sectionId: string) => void;
  onResetLayout: () => void;
  onMoveSection: (sectionId: string, column: 'left' | 'right', order: number) => void;
}

export function LayoutToolbar({
  sections,
  onToggleSection,
  onResetLayout,
  onMoveSection,
}: LayoutToolbarProps) {
  const hiddenSections = sections.filter(s => !s.visible);
  const leftSections = sections.filter(s => s.column === 'left').sort((a, b) => a.order - b.order);
  const rightSections = sections.filter(s => s.column === 'right').sort((a, b) => a.order - b.order);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Customize Layout
            {hiddenSections.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded-full">
                {hiddenSections.length} hidden
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-h-[70vh] overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            Left Column
          </DropdownMenuLabel>
          {leftSections.map(section => (
            <DropdownMenuCheckboxItem
              key={section.id}
              checked={section.visible}
              onCheckedChange={() => onToggleSection(section.id)}
            >
              <span className="flex items-center gap-2">
                {section.visible ? (
                  <Eye className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                )}
                {section.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="flex items-center gap-2">
            <Columns className="w-4 h-4" />
            Right Column
          </DropdownMenuLabel>
          {rightSections.map(section => (
            <DropdownMenuCheckboxItem
              key={section.id}
              checked={section.visible}
              onCheckedChange={() => onToggleSection(section.id)}
            >
              <span className="flex items-center gap-2">
                {section.visible ? (
                  <Eye className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                )}
                {section.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}

          {hiddenSections.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground">
                Hidden Sections
              </DropdownMenuLabel>
              {hiddenSections.map(section => (
                <DropdownMenuItem
                  key={section.id}
                  onClick={() => onToggleSection(section.id)}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="w-3 h-3" />
                  <span className="flex-1">{section.label}</span>
                  <span className="text-xs text-muted-foreground">Click to show</span>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onResetLayout} className="text-destructive">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default Layout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
