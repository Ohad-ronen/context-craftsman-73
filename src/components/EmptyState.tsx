import { Button } from '@/components/ui/button';
import { Plus, Layers, ArrowRight } from 'lucide-react';
import { FlowDiagram } from './FlowDiagram';

interface EmptyStateProps {
  onNewExperiment: () => void;
}

export function EmptyState({ onNewExperiment }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 animate-fade-in">
      <div className="p-4 rounded-2xl bg-primary/10 mb-6">
        <Layers className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Start Tracking Your Agent Experiments</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Track inputs, contexts, prompts, and outputs to iterate faster and showcase your progress to leadership.
      </p>
      
      <FlowDiagram />
      
      <Button onClick={onNewExperiment} size="lg" className="mt-6 gap-2">
        <Plus className="w-5 h-5" />
        Create Your First Experiment
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
