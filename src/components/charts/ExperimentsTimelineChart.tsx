import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { TimelineData } from '@/hooks/useDashboardStats';
import { Activity, PartyPopper } from 'lucide-react';

interface ExperimentsTimelineChartProps {
  data: TimelineData[];
}

export function ExperimentsTimelineChart({ data }: ExperimentsTimelineChartProps) {
  // Find milestone points (multiples of 25 or 50)
  const milestones = data.filter((d, i) => {
    const prevTotal = i > 0 ? data[i - 1].cumulativeCount : 0;
    return [25, 50, 75, 100, 150, 200].some(m => prevTotal < m && d.cumulativeCount >= m);
  });

  const latestTotal = data.length > 0 ? data[data.length - 1].cumulativeCount : 0;

  return (
    <Card className="group bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Experiments Timeline
          </CardTitle>
          {latestTotal > 0 && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Total: {latestTotal}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.4}/>
                    <stop offset="50%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(210, 80%, 55%)" />
                    <stop offset="100%" stopColor="hsl(280, 70%, 60%)" />
                  </linearGradient>
                  <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                  </filter>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 10px 40px -10px hsl(0 0% 0% / 0.3)',
                  }}
                  formatter={(value: number, name: string) => [
                    <div key="value" className="flex flex-col">
                      <span className="text-lg font-bold">{value}</span>
                      <span className="text-xs text-muted-foreground">
                        {name === 'cumulativeCount' ? 'Total experiments' : 'New this day'}
                      </span>
                    </div>,
                    ''
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeCount" 
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  fill="url(#timelineGradient)"
                  filter="url(#lineGlow)"
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isMilestone = milestones.some(m => m.date === payload.date);
                    const isLast = payload === data[data.length - 1];
                    
                    if (isMilestone) {
                      return (
                        <g key={`dot-${cx}-${cy}`}>
                          <circle cx={cx} cy={cy} r={8} fill="hsl(35, 90%, 55%)" opacity={0.3} />
                          <circle cx={cx} cy={cy} r={5} fill="hsl(35, 90%, 55%)" />
                          <text x={cx} y={cy - 14} textAnchor="middle" fill="hsl(35, 90%, 55%)" fontSize={10} fontWeight="bold">
                            🎉
                          </text>
                        </g>
                      );
                    }
                    
                    if (isLast) {
                      return (
                        <g key={`dot-${cx}-${cy}`}>
                          <circle cx={cx} cy={cy} r={6} fill="hsl(280, 70%, 60%)" className="animate-pulse" />
                          <circle cx={cx} cy={cy} r={3} fill="white" />
                        </g>
                      );
                    }
                    
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={0} />;
                  }}
                  activeDot={{ 
                    r: 6, 
                    fill: 'hsl(280, 70%, 60%)',
                    stroke: 'white',
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
