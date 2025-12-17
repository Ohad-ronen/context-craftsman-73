import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { RatingTrendData } from '@/hooks/useDashboardStats';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface RatingTrendChartProps {
  data: RatingTrendData[];
}

export function RatingTrendChart({ data }: RatingTrendChartProps) {
  // Calculate trend direction
  const trendDirection = data.length >= 2 
    ? data[data.length - 1].averageRating - data[0].averageRating
    : 0;
  
  const latestRating = data.length > 0 ? data[data.length - 1].averageRating : 0;

  return (
    <Card className="group bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            Rating Trend
          </CardTitle>
          {data.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${
                trendDirection > 0 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : trendDirection < 0 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {trendDirection > 0 ? <ArrowUpRight className="h-3 w-3" /> 
                  : trendDirection < 0 ? <ArrowDownRight className="h-3 w-3" />
                  : <Minus className="h-3 w-3" />}
                {trendDirection !== 0 ? `${trendDirection > 0 ? '+' : ''}${trendDirection.toFixed(2)}` : 'Stable'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No rated experiments yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(280, 70%, 60%)" />
                    <stop offset="100%" stopColor="hsl(175, 70%, 50%)" />
                  </linearGradient>
                  <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(175, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <filter id="trendGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Zone backgrounds */}
                <ReferenceArea y1={0} y2={3} fill="hsl(0, 72%, 50%)" fillOpacity={0.03} />
                <ReferenceArea y1={3} y2={4} fill="hsl(45, 90%, 50%)" fillOpacity={0.03} />
                <ReferenceArea y1={4} y2={5} fill="hsl(145, 60%, 45%)" fillOpacity={0.05} />
                
                {/* Success threshold line */}
                <ReferenceLine 
                  y={4} 
                  stroke="hsl(145, 60%, 45%)" 
                  strokeDasharray="4 4" 
                  strokeOpacity={0.5}
                  label={{
                    value: '4★ Success',
                    position: 'right',
                    fill: 'hsl(145, 60%, 45%)',
                    fontSize: 10,
                  }}
                />
                
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 5]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 1, 2, 3, 4, 5]}
                />
                <Tooltip
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
                        <span className="text-lg font-bold">{value}★</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          value >= 4 ? 'bg-emerald-500/20 text-emerald-400' 
                            : value >= 3 ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {value >= 4 ? 'Success' : value >= 3 ? 'Fair' : 'Needs work'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {props.payload.count} experiments rated
                      </span>
                    </div>,
                    ''
                  ]}
                  labelFormatter={(label) => (
                    <span className="font-medium text-sm">Week of {label}</span>
                  )}
                />
                <Line 
                  type="monotone" 
                  dataKey="averageRating" 
                  stroke="url(#trendLineGradient)"
                  strokeWidth={3}
                  filter="url(#trendGlow)"
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    const isLast = index === data.length - 1;
                    const isHigh = payload.averageRating >= 4;
                    
                    return (
                      <g key={`dot-${cx}-${cy}`}>
                        {isLast && (
                          <>
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={10} 
                              fill="hsl(175, 70%, 50%)" 
                              opacity={0.2}
                              className="animate-ping"
                            />
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={6} 
                              fill="hsl(175, 70%, 50%)"
                            />
                            <circle cx={cx} cy={cy} r={2.5} fill="white" />
                          </>
                        )}
                        {!isLast && (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={isHigh ? 5 : 4} 
                            fill={isHigh ? 'hsl(145, 60%, 45%)' : 'hsl(280, 70%, 60%)'}
                            stroke="hsl(var(--card))"
                            strokeWidth={2}
                          />
                        )}
                      </g>
                    );
                  }}
                  activeDot={{ 
                    r: 8, 
                    fill: 'hsl(175, 70%, 50%)',
                    stroke: 'white',
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
