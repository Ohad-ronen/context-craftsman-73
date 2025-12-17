import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RatingDistribution } from '@/hooks/useDashboardStats';
import { Star } from 'lucide-react';

interface RatingDistributionChartProps {
  data: RatingDistribution[];
}

const GRADIENTS = [
  { id: 'rating1', start: 'hsl(0, 72%, 55%)', end: 'hsl(15, 80%, 50%)' },
  { id: 'rating2', start: 'hsl(25, 85%, 55%)', end: 'hsl(35, 90%, 50%)' },
  { id: 'rating3', start: 'hsl(45, 90%, 50%)', end: 'hsl(55, 85%, 55%)' },
  { id: 'rating4', start: 'hsl(145, 60%, 45%)', end: 'hsl(160, 65%, 50%)' },
  { id: 'rating5', start: 'hsl(165, 70%, 45%)', end: 'hsl(175, 70%, 50%)' },
];

const LABELS = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function RatingDistributionChart({ data }: RatingDistributionChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const dominantRating = data.reduce((prev, curr) => 
    curr.count > prev.count ? curr : prev, data[0]);

  return (
    <Card className="group bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Rating Distribution
          </CardTitle>
          {dominantRating.count > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Most: {dominantRating.rating}★ ({dominantRating.count})
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {GRADIENTS.map((g, i) => (
                  <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={g.start} stopOpacity={1} />
                    <stop offset="100%" stopColor={g.end} stopOpacity={0.8} />
                  </linearGradient>
                ))}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <XAxis 
                dataKey="rating" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tickFormatter={(value) => `${value}★`}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
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
                formatter={(value: number, name: string, props: any) => {
                  const rating = props.payload.rating;
                  return [
                    <div key="tooltip" className="flex flex-col gap-1">
                      <span className="text-lg font-bold">{value} experiments</span>
                      <span className="text-xs text-muted-foreground">{LABELS[rating - 1]} quality</span>
                    </div>,
                    ''
                  ];
                }}
                labelFormatter={(label) => (
                  <div className="flex items-center gap-1 mb-1">
                    {'★'.repeat(label)}{'☆'.repeat(5 - label)}
                  </div>
                )}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#${GRADIENTS[index].id})`}
                    style={{
                      filter: entry.count === maxCount && entry.count > 0 ? 'url(#glow)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
