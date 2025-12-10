import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  step: 'input' | 'context' | 'prompt' | 'output';
  label: string;
  isActive?: boolean;
}

const stepColors = {
  input: 'bg-step-input ring-step-input',
  context: 'bg-step-context ring-step-context',
  prompt: 'bg-step-prompt ring-step-prompt',
  output: 'bg-step-output ring-step-output',
};

const stepTextColors = {
  input: 'text-step-input',
  context: 'text-step-context',
  prompt: 'text-step-prompt',
  output: 'text-step-output',
};

export function StepIndicator({ step, label, isActive = false }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className={cn(
          "step-indicator transition-all duration-300",
          stepColors[step],
          isActive && "scale-125 animate-pulse-glow"
        )} 
      />
      <span className={cn(
        "text-sm font-medium transition-colors",
        isActive ? stepTextColors[step] : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}
