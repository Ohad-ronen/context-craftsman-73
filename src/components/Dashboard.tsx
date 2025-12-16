import { Experiment } from '@/hooks/useExperiments';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatsCard } from '@/components/StatsCard';
import { RatingDistributionChart } from '@/components/charts/RatingDistributionChart';
import { ExperimentsTimelineChart } from '@/components/charts/ExperimentsTimelineChart';
import { GoalPerformanceChart } from '@/components/charts/GoalPerformanceChart';
import { RatingTrendChart } from '@/components/charts/RatingTrendChart';
import { FlaskConical, Star, TrendingUp, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Experiments"
          value={summaryStats.totalExperiments}
          subtitle={`${summaryStats.experimentsThisWeek} this week`}
          icon={<FlaskConical className="h-5 w-5" />}
          delay={0}
          className="animate-fade-in"
        />
        <StatsCard
          title="Average Rating"
          value={summaryStats.averageRating > 0 ? `${summaryStats.averageRating}★` : '—'}
          subtitle={`${summaryStats.ratedExperiments} rated`}
          icon={<Star className="h-5 w-5" />}
          delay={100}
          className="animate-fade-in"
        />
        <StatsCard
          title="Success Rate"
          value={summaryStats.ratedExperiments > 0 ? `${summaryStats.successRate}%` : '—'}
          subtitle="Rating ≥ 4 stars"
          icon={<CheckCircle2 className="h-5 w-5" />}
          trend={summaryStats.successRate >= 70 ? 'up' : summaryStats.successRate >= 50 ? 'neutral' : 'down'}
          delay={200}
          className="animate-fade-in"
        />
        <StatsCard
          title="Unrated"
          value={summaryStats.unratedExperiments}
          subtitle="Awaiting evaluation"
          icon={<TrendingUp className="h-5 w-5" />}
          delay={300}
          className="animate-fade-in"
        />
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
