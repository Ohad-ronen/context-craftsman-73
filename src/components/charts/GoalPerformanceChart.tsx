import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GoalPerformance } from '@/hooks/useDashboardStats';

interface GoalPerformanceChartProps {
  data: GoalPerformance[];
}

export function GoalPerformanceChart({ data }: GoalPerformanceChartProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Performance by Goal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          {data.length === 0 || data.every(d => d.averageRating === 0) ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No rated experiments yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                layout="vertical" 
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis 
                  type="number" 
                  domain={[0, 5]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="goal" 
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value: number, _, props) => [
                    `${value}★ (${props.payload.count} experiments)`, 
                    'Avg Rating'
                  ]}
                />
                <Bar 
                  dataKey="averageRating" 
                  fill="hsl(var(--chart-1))" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
