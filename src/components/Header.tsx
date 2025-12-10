import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';

interface HeaderProps {
  onNewExperiment: () => void;
  experimentCount: number;
}

export function Header({ onNewExperiment, experimentCount }: HeaderProps) {
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
          <Button onClick={onNewExperiment} className="gap-2">
            <Plus className="w-4 h-4" />
            New Experiment
          </Button>
        </div>
      </div>
    </header>
  );
}
