import { ArrowDown } from 'lucide-react';

const steps = [
  { id: 'input', label: 'Raw Data', color: 'bg-step-input' },
  { id: 'context', label: 'Context', color: 'bg-step-context' },
  { id: 'prompt', label: 'Prompt', color: 'bg-step-prompt' },
  { id: 'output', label: 'Output', color: 'bg-step-output' },
];

export function FlowDiagram() {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${step.color}`} />
            <span className="text-xs text-muted-foreground">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <ArrowDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
          )}
        </div>
      ))}
    </div>
  );
}
