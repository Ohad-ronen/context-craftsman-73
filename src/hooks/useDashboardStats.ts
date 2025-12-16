import { useMemo } from 'react';
import { Experiment } from '@/hooks/useExperiments';
import { startOfDay, startOfWeek, format, parseISO, subDays } from 'date-fns';

export interface SummaryStats {
  totalExperiments: number;
  ratedExperiments: number;
  unratedExperiments: number;
  averageRating: number;
  successRate: number; // % with rating >= 4
  experimentsThisWeek: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
}

export interface TimelineData {
  date: string;
  count: number;
  cumulativeCount: number;
}

export interface GoalPerformance {
  goal: string;
  averageRating: number;
  count: number;
}

export interface RatingTrendData {
  date: string;
  averageRating: number;
  count: number;
}

export function useDashboardStats(experiments: Experiment[]) {
  const summaryStats = useMemo((): SummaryStats => {
    const rated = experiments.filter(e => e.rating !== null && e.rating !== undefined);
    const avgRating = rated.length > 0 
      ? rated.reduce((sum, e) => sum + (e.rating || 0), 0) / rated.length 
      : 0;
    const successful = rated.filter(e => (e.rating || 0) >= 4);
    
    const oneWeekAgo = subDays(new Date(), 7);
    const thisWeek = experiments.filter(e => parseISO(e.created_at) >= oneWeekAgo);

    return {
      totalExperiments: experiments.length,
      ratedExperiments: rated.length,
      unratedExperiments: experiments.length - rated.length,
      averageRating: Math.round(avgRating * 100) / 100,
      successRate: rated.length > 0 ? Math.round((successful.length / rated.length) * 100) : 0,
      experimentsThisWeek: thisWeek.length,
    };
  }, [experiments]);

  const ratingDistribution = useMemo((): RatingDistribution[] => {
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: experiments.filter(e => e.rating === rating).length,
    }));
    return distribution;
  }, [experiments]);

  const experimentsTimeline = useMemo((): TimelineData[] => {
    if (experiments.length === 0) return [];

    const sorted = [...experiments].sort(
      (a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime()
    );

    const dailyCounts = new Map<string, number>();
    sorted.forEach(exp => {
      const day = format(startOfDay(parseISO(exp.created_at)), 'MMM dd');
      dailyCounts.set(day, (dailyCounts.get(day) || 0) + 1);
    });

    let cumulative = 0;
    return Array.from(dailyCounts.entries()).map(([date, count]) => {
      cumulative += count;
      return { date, count, cumulativeCount: cumulative };
    });
  }, [experiments]);

  const goalPerformance = useMemo((): GoalPerformance[] => {
    const goalMap = new Map<string, { total: number; count: number; ratedCount: number }>();
    
    experiments.forEach(exp => {
      const goal = exp.goal || 'No Goal';
      const truncatedGoal = goal.length > 30 ? goal.substring(0, 30) + '...' : goal;
      
      if (!goalMap.has(truncatedGoal)) {
        goalMap.set(truncatedGoal, { total: 0, count: 0, ratedCount: 0 });
      }
      
      const data = goalMap.get(truncatedGoal)!;
      data.count++;
      if (exp.rating !== null && exp.rating !== undefined) {
        data.total += exp.rating;
        data.ratedCount++;
      }
    });

    return Array.from(goalMap.entries())
      .map(([goal, data]) => ({
        goal,
        averageRating: data.ratedCount > 0 ? Math.round((data.total / data.ratedCount) * 100) / 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);
  }, [experiments]);

  const ratingTrend = useMemo((): RatingTrendData[] => {
    const rated = experiments.filter(e => e.rating !== null && e.rating !== undefined);
    if (rated.length === 0) return [];

    const sorted = [...rated].sort(
      (a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime()
    );

    const weeklyData = new Map<string, { total: number; count: number }>();
    sorted.forEach(exp => {
      const week = format(startOfWeek(parseISO(exp.created_at)), 'MMM dd');
      if (!weeklyData.has(week)) {
        weeklyData.set(week, { total: 0, count: 0 });
      }
      const data = weeklyData.get(week)!;
      data.total += exp.rating || 0;
      data.count++;
    });

    return Array.from(weeklyData.entries()).map(([date, data]) => ({
      date,
      averageRating: Math.round((data.total / data.count) * 100) / 100,
      count: data.count,
    }));
  }, [experiments]);

  return {
    summaryStats,
    ratingDistribution,
    experimentsTimeline,
    goalPerformance,
    ratingTrend,
  };
}
