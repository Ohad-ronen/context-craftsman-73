import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface ExperimentRequest {
  id: string;
  user_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timeout';
  parameters: {
    goal?: string;
    mission?: string;
    example?: string;
    rules?: string;
    use_websearch?: boolean;
  };
  experiment_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useExperimentRequests() {
  const { user } = useAuth();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['experiment-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('experiment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching experiment requests:', error);
        throw error;
      }

      return (data || []) as ExperimentRequest[];
    },
    enabled: !!user,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('experiment-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'experiment_requests',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'processing');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const failedRequests = requests.filter(r => r.status === 'failed' || r.status === 'timeout');

  return {
    requests,
    pendingRequests,
    completedRequests,
    failedRequests,
    isLoading,
    refetch,
  };
}
