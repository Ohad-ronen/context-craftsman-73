import { Button } from '@/components/ui/button';
import { Plus, Layers, LayoutGrid, Table2 } from 'lucide-react';

interface HeaderProps {
  onNewExperiment: () => void;
  experimentCount: number;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
}

export function Header({ onNewExperiment, experimentCount, viewMode, onViewModeChange }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/10">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agent Tracker</h1>
              <p className="text-sm text-muted-foreground">
                {experimentCount} experiment{experimentCount !== 1 ? 's' : ''} tracked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-border p-1">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('cards')}
                className="gap-1.5"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('table')}
                className="gap-1.5"
              >
                <Table2 className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>
            
            <Button onClick={onNewExperiment} className="gap-2">
              <Plus className="w-4 h-4" />
              New Experiment
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
