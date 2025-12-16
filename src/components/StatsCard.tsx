import { ReactNode, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  delay?: number;
}

function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    
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

export function StatsCard({ title, value, subtitle, icon, trend, className, delay = 0 }: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const isPercentage = typeof value === 'string' && value.includes('%');
  const percentValue = isPercentage ? parseFloat(value) : null;

  return (
    <Card 
      className={cn(
        "bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30",
        "group cursor-default",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground animate-count-up">
              {isNumeric ? (
                <AnimatedNumber value={numericValue} />
              ) : isPercentage && percentValue !== null ? (
                <><AnimatedNumber value={percentValue} />%</>
              ) : (
                value
              )}
            </p>
            {subtitle && (
              <p className={cn(
                "text-sm transition-colors duration-300",
                trend === 'up' && "text-green-500",
                trend === 'down' && "text-red-500",
                trend === 'neutral' && "text-muted-foreground",
                !trend && "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-primary/10 rounded-lg text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:rotate-3">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
