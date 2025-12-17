import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: 'teal' | 'purple' | 'amber' | 'emerald' | 'blue';
}

const colorMap = {
  teal: 'stroke-[hsl(175_70%_50%)]',
  purple: 'stroke-[hsl(280_70%_60%)]',
  amber: 'stroke-[hsl(35_90%_55%)]',
  emerald: 'stroke-[hsl(145_60%_45%)]',
  blue: 'stroke-[hsl(210_80%_55%)]',
};

const glowMap = {
  teal: 'drop-shadow-[0_0_8px_hsl(175_70%_50%/0.6)]',
  purple: 'drop-shadow-[0_0_8px_hsl(280_70%_60%/0.6)]',
  amber: 'drop-shadow-[0_0_8px_hsl(35_90%_55%/0.6)]',
  emerald: 'drop-shadow-[0_0_8px_hsl(145_60%_45%/0.6)]',
  blue: 'drop-shadow-[0_0_8px_hsl(210_80%_55%/0.6)]',
};

export function ProgressRing({ 
  value, 
  max = 100, 
  size = 48, 
  strokeWidth = 4,
  className,
  color = 'teal'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference - percent * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg 
        width={size} 
        height={size} 
        className={cn("transform -rotate-90", glowMap[color])}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            colorMap[color],
            "transition-all duration-1000 ease-out"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-foreground">
          {Math.round(percent * 100)}%
        </span>
      </div>
    </div>
  );
}
