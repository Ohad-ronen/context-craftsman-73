import { SummaryStats, GoalPerformance, RatingTrendData } from '@/hooks/useDashboardStats';
import { Trophy, TrendingUp, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickInsightsProps {
  summaryStats: SummaryStats;
  goalPerformance: GoalPerformance[];
  ratingTrend: RatingTrendData[];
}

export function QuickInsights({ summaryStats, goalPerformance, ratingTrend }: QuickInsightsProps) {
  const bestGoal = goalPerformance[0];
  
  // Calculate trend
  const trendDirection = ratingTrend.length >= 2 
    ? ratingTrend[ratingTrend.length - 1].averageRating - ratingTrend[0].averageRating
    : 0;
  
  // Next milestone calculation
  const milestones = [50, 100, 200, 500, 1000];
  const nextMilestone = milestones.find(m => m > summaryStats.totalExperiments) || 
    Math.ceil(summaryStats.totalExperiments / 100) * 100 + 100;
  const toNextMilestone = nextMilestone - summaryStats.totalExperiments;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
      {/* Best Performing Goal */}
      {bestGoal && bestGoal.averageRating > 0 && (
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 p-4 transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground font-medium">Best Performer</p>
              <p className="text-sm font-semibold text-foreground truncate">{bestGoal.goal}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-400 font-bold">{bestGoal.averageRating}★</span>
                <span className="text-xs text-muted-foreground">avg</span>
              </div>
            </div>
            <Sparkles className="h-4 w-4 text-amber-400/60 animate-pulse" />
          </div>
        </div>
      )}

      {/* Trend Summary */}
      <div className={cn(
        "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-lg",
        trendDirection > 0 
          ? "bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-emerald-500/10"
          : trendDirection < 0
          ? "bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent border-rose-500/20 hover:border-rose-500/40 hover:shadow-rose-500/10"
          : "bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border-blue-500/20 hover:border-blue-500/40 hover:shadow-blue-500/10"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-colors",
          trendDirection > 0 ? "bg-emerald-500/10 group-hover:bg-emerald-500/20" 
            : trendDirection < 0 ? "bg-rose-500/10 group-hover:bg-rose-500/20"
            : "bg-blue-500/10 group-hover:bg-blue-500/20"
        )} />
        <div className="relative flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            trendDirection > 0 ? "bg-emerald-500/20 text-emerald-400"
              : trendDirection < 0 ? "bg-rose-500/20 text-rose-400"
              : "bg-blue-500/20 text-blue-400"
          )}>
            <TrendingUp className={cn("h-5 w-5", trendDirection < 0 && "rotate-180")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">Rating Trend</p>
            <p className="text-sm font-semibold text-foreground">
              {trendDirection > 0 ? '📈 Improving' : trendDirection < 0 ? '📉 Declining' : '➡️ Stable'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trendDirection !== 0 
                ? `${trendDirection > 0 ? '+' : ''}${trendDirection.toFixed(2)} overall`
                : 'Consistent quality'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Next Milestone */}
      <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent border border-purple-500/20 p-4 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors" />
        <div className="relative flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">Next Milestone</p>
            <p className="text-sm font-semibold text-foreground">🎯 {nextMilestone} Experiments</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {toNextMilestone} more to go!
            </p>
          </div>
          <div className="text-2xl font-bold text-purple-400/60">
            {Math.round((summaryStats.totalExperiments / nextMilestone) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}
