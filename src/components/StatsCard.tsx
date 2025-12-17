import { ReactNode, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/charts/ProgressRing';
import { Sparkline } from '@/components/charts/Sparkline';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  delay?: number;
  variant?: 'default' | 'teal' | 'purple' | 'amber' | 'emerald' | 'blue';
  sparklineData?: number[];
  showProgressRing?: boolean;
  progressValue?: number;
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.round(startValue + (value - startValue) * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue}</>;
}

const variantStyles = {
  default: {
    gradient: 'from-card via-card to-card',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderHover: 'hover:border-primary/30',
    glow: 'hover:shadow-primary/10',
  },
  teal: {
    gradient: 'from-[hsl(175_70%_50%/0.08)] via-card to-card',
    iconBg: 'bg-[hsl(175_70%_50%/0.15)]',
    iconColor: 'text-[hsl(175_70%_50%)]',
    borderHover: 'hover:border-[hsl(175_70%_50%/0.4)]',
    glow: 'hover:shadow-[hsl(175_70%_50%/0.15)]',
  },
  purple: {
    gradient: 'from-[hsl(280_70%_60%/0.08)] via-card to-card',
    iconBg: 'bg-[hsl(280_70%_60%/0.15)]',
    iconColor: 'text-[hsl(280_70%_60%)]',
    borderHover: 'hover:border-[hsl(280_70%_60%/0.4)]',
    glow: 'hover:shadow-[hsl(280_70%_60%/0.15)]',
  },
  amber: {
    gradient: 'from-[hsl(35_90%_55%/0.08)] via-card to-card',
    iconBg: 'bg-[hsl(35_90%_55%/0.15)]',
    iconColor: 'text-[hsl(35_90%_55%)]',
    borderHover: 'hover:border-[hsl(35_90%_55%/0.4)]',
    glow: 'hover:shadow-[hsl(35_90%_55%/0.15)]',
  },
  emerald: {
    gradient: 'from-[hsl(145_60%_45%/0.08)] via-card to-card',
    iconBg: 'bg-[hsl(145_60%_45%/0.15)]',
    iconColor: 'text-[hsl(145_60%_45%)]',
    borderHover: 'hover:border-[hsl(145_60%_45%/0.4)]',
    glow: 'hover:shadow-[hsl(145_60%_45%/0.15)]',
  },
  blue: {
    gradient: 'from-[hsl(210_80%_55%/0.08)] via-card to-card',
    iconBg: 'bg-[hsl(210_80%_55%/0.15)]',
    iconColor: 'text-[hsl(210_80%_55%)]',
    borderHover: 'hover:border-[hsl(210_80%_55%/0.4)]',
    glow: 'hover:shadow-[hsl(210_80%_55%/0.15)]',
  },
};

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  className, 
  delay = 0,
  variant = 'default',
  sparklineData,
  showProgressRing,
  progressValue,
}: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const isPercentage = typeof value === 'string' && value.includes('%');
  const percentValue = isPercentage ? parseFloat(value) : null;
  
  const styles = variantStyles[variant];
  const sparklineColor = variant === 'default' ? 'teal' : variant;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden bg-gradient-to-br border-border/50 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        "group cursor-default",
        styles.gradient,
        styles.borderHover,
        styles.glow,
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle glow effect */}
      <div className={cn(
        "absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100",
        variant === 'teal' && "bg-[hsl(175_70%_50%/0.2)]",
        variant === 'purple' && "bg-[hsl(280_70%_60%/0.2)]",
        variant === 'amber' && "bg-[hsl(35_90%_55%/0.2)]",
        variant === 'emerald' && "bg-[hsl(145_60%_45%/0.2)]",
        variant === 'blue' && "bg-[hsl(210_80%_55%/0.2)]",
        variant === 'default' && "bg-primary/20"
      )} />
      
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            
            {/* Sparkline */}
            {sparklineData && sparklineData.length > 1 && (
              <div className="py-1">
                <Sparkline 
                  data={sparklineData} 
                  width={100} 
                  height={24} 
                  color={sparklineColor}
                />
              </div>
            )}
            
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {isNumeric ? (
                  <AnimatedNumber value={numericValue} />
                ) : isPercentage && percentValue !== null ? (
                  <><AnimatedNumber value={percentValue} />%</>
                ) : (
                  value
                )}
              </p>
              
              {/* Trend indicator */}
              {trend && (
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  trend === 'up' && "text-emerald-400",
                  trend === 'down' && "text-rose-400",
                  trend === 'neutral' && "text-muted-foreground"
                )}>
                  {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                  {trend === 'neutral' && <Minus className="h-3 w-3" />}
                  {trendValue && <span>{trendValue}</span>}
                </div>
              )}
            </div>
            
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Right side - Icon or Progress Ring */}
          <div className="flex flex-col items-center gap-2">
            {showProgressRing && progressValue !== undefined ? (
              <ProgressRing 
                value={progressValue} 
                size={52} 
                strokeWidth={4}
                color={variant === 'default' ? 'teal' : variant}
              />
            ) : icon ? (
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-300",
                "group-hover:scale-110 group-hover:rotate-3",
                styles.iconBg,
                styles.iconColor
              )}>
                {icon}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
