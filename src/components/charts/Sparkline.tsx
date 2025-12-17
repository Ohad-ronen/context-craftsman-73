import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
  color?: 'teal' | 'purple' | 'amber' | 'emerald' | 'blue';
  showGlow?: boolean;
}

const colorMap = {
  teal: { stroke: 'hsl(175, 70%, 50%)', fill: 'hsl(175, 70%, 50%)' },
  purple: { stroke: 'hsl(280, 70%, 60%)', fill: 'hsl(280, 70%, 60%)' },
  amber: { stroke: 'hsl(35, 90%, 55%)', fill: 'hsl(35, 90%, 55%)' },
  emerald: { stroke: 'hsl(145, 60%, 45%)', fill: 'hsl(145, 60%, 45%)' },
  blue: { stroke: 'hsl(210, 80%, 55%)', fill: 'hsl(210, 80%, 55%)' },
};

export function Sparkline({ 
  data, 
  width = 80, 
  height = 24, 
  className,
  color = 'teal',
  showGlow = true
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div 
        className={cn("bg-muted/20 rounded", className)} 
        style={{ width, height }}
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;
  const colors = colorMap[color];

  return (
    <svg 
      width={width} 
      height={height} 
      className={cn(
        "overflow-visible",
        showGlow && "drop-shadow-[0_0_4px_hsl(175_70%_50%/0.4)]",
        className
      )}
    >
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.fill} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill={`url(#sparkline-gradient-${color})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={colors.stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={width - padding}
        cy={padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight}
        r="2.5"
        fill={colors.fill}
        className="animate-pulse"
      />
    </svg>
  );
}
