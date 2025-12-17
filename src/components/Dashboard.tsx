import { useMemo } from 'react';
import { Experiment } from '@/hooks/useExperiments';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/components/StatsCard';
import { RatingDistributionChart } from '@/components/charts/RatingDistributionChart';
import { ExperimentsTimelineChart } from '@/components/charts/ExperimentsTimelineChart';
import { GoalPerformanceChart } from '@/components/charts/GoalPerformanceChart';
import { RatingTrendChart } from '@/components/charts/RatingTrendChart';
import { QuickInsights } from '@/components/QuickInsights';
import { FlaskConical, Star, CheckCircle2, Globe, Clock } from 'lucide-react';

interface DashboardProps {
  experiments: Experiment[];
}

export function Dashboard({ experiments }: DashboardProps) {
  const { 
    summaryStats, 
    ratingDistribution, 
    experimentsTimeline, 
    goalPerformance, 
    ratingTrend 
  } = useDashboardStats(experiments);

  // Generate sparkline data for total experiments (last 7 data points)
  const experimentSparkline = useMemo(() => {
    if (experimentsTimeline.length === 0) return [];
    const recent = experimentsTimeline.slice(-7);
    return recent.map(d => d.cumulativeCount);
  }, [experimentsTimeline]);

  // Generate sparkline data for ratings trend
  const ratingSparkline = useMemo(() => {
    if (ratingTrend.length === 0) return [];
    return ratingTrend.slice(-7).map(d => d.averageRating);
  }, [ratingTrend]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Experiments"
          value={summaryStats.totalExperiments}
          subtitle={`${summaryStats.experimentsThisWeek} this week`}
          icon={<FlaskConical className="h-5 w-5" />}
          variant="teal"
          sparklineData={experimentSparkline}
          delay={0}
          className="animate-fade-in"
        />
        <StatsCard
          title="Average Rating"
          value={summaryStats.averageRating > 0 ? `${summaryStats.averageRating}★` : '—'}
          subtitle={`${summaryStats.ratedExperiments} rated`}
          icon={<Star className="h-5 w-5" />}
          variant="purple"
          sparklineData={ratingSparkline}
          delay={100}
          className="animate-fade-in"
        />
        <StatsCard
          title="Success Rate"
          value={summaryStats.ratedExperiments > 0 ? `${summaryStats.successRate}%` : '—'}
          subtitle="Rating ≥ 4 stars"
          showProgressRing
          progressValue={summaryStats.successRate}
          variant="emerald"
          trend={summaryStats.successRate >= 70 ? 'up' : summaryStats.successRate >= 50 ? 'neutral' : 'down'}
          delay={200}
          className="animate-fade-in"
        />
        <StatsCard
          title="Web Search"
          value={summaryStats.totalExperiments > 0 ? `${summaryStats.webSearchPercentage}%` : '—'}
          subtitle={`${summaryStats.webSearchCount} experiments`}
          showProgressRing
          progressValue={summaryStats.webSearchPercentage}
          variant="blue"
          delay={300}
          className="animate-fade-in"
        />
        <StatsCard
          title="Unrated"
          value={summaryStats.unratedExperiments}
          subtitle="Awaiting evaluation"
          icon={<Clock className="h-5 w-5" />}
          variant="amber"
          delay={400}
          className="animate-fade-in"
        />
      </div>

      {/* Quick Insights Row */}
      <QuickInsights 
        summaryStats={summaryStats}
        goalPerformance={goalPerformance}
        ratingTrend={ratingTrend}
      />

      {/* Section Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Analytics</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <RatingDistributionChart data={ratingDistribution} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <ExperimentsTimelineChart data={experimentsTimeline} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <GoalPerformanceChart data={goalPerformance} />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <RatingTrendChart data={ratingTrend} />
        </div>
      </div>
    </div>
  );
}
