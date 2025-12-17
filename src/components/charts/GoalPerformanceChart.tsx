import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoalPerformance } from '@/hooks/useDashboardStats';
import { Target, Star } from 'lucide-react';

interface GoalPerformanceChartProps {
  data: GoalPerformance[];
}

const getGradientByRating = (rating: number) => {
  if (rating >= 4.5) return { id: 'excellent', start: 'hsl(165, 70%, 45%)', end: 'hsl(175, 70%, 50%)' };
  if (rating >= 4) return { id: 'great', start: 'hsl(145, 60%, 45%)', end: 'hsl(160, 65%, 50%)' };
  if (rating >= 3) return { id: 'good', start: 'hsl(45, 90%, 50%)', end: 'hsl(55, 85%, 55%)' };
  if (rating >= 2) return { id: 'fair', start: 'hsl(25, 85%, 55%)', end: 'hsl(35, 90%, 50%)' };
  return { id: 'poor', start: 'hsl(0, 72%, 55%)', end: 'hsl(15, 80%, 50%)' };
};

export function GoalPerformanceChart({ data }: GoalPerformanceChartProps) {
  const hasData = data.length > 0 && data.some(d => d.averageRating > 0);
  
  // Create unique gradients based on ratings
  const uniqueGradients = [...new Set(data.map(d => getGradientByRating(d.averageRating).id))]
    .map(id => {
      const sample = data.find(d => getGradientByRating(d.averageRating).id === id);
      return sample ? getGradientByRating(sample.averageRating) : null;
    })
    .filter(Boolean);

  return (
    <Card className="group bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            Performance by Goal
          </CardTitle>
          {hasData && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Top {data.length} goals
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {!hasData ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No rated experiments yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
              >
                <defs>
                  {uniqueGradients.map((g) => g && (
                    <linearGradient key={g.id} id={`goal-${g.id}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={g.start} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={g.end} stopOpacity={1} />
                    </linearGradient>
                  ))}
                  <filter id="barGlow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <XAxis 
                  type="number" 
                  domain={[0, 5]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  ticks={[0, 1, 2, 3, 4, 5]}
                />
                <YAxis 
                  type="category" 
                  dataKey="goal" 
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 10px 40px -10px hsl(0 0% 0% / 0.3)',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    <div key="value" className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-lg font-bold">{value}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {props.payload.count} experiments
                      </span>
                    </div>,
                    ''
                  ]}
                  labelFormatter={(label) => (
                    <span className="font-medium">{label}</span>
                  )}
                />
                <Bar 
                  dataKey="averageRating" 
                  radius={[0, 8, 8, 0]}
                  maxBarSize={32}
                >
                  {data.map((entry, index) => {
                    const gradient = getGradientByRating(entry.averageRating);
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#goal-${gradient.id})`}
                        style={{
                          filter: entry.averageRating >= 4 ? 'url(#barGlow)' : 'none',
                        }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
