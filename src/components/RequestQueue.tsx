import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronRight,
  Activity,
  RefreshCw
} from "lucide-react";
import { useExperimentRequests, ExperimentRequest } from "@/hooks/useExperimentRequests";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RequestQueueProps {
  onExperimentClick?: (id: string) => void;
}

const statusConfig: Record<string, {
  label: string;
  icon: typeof Clock;
  className: string;
  iconClassName?: string;
}> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    iconClassName: 'animate-spin',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
  },
  timeout: {
    label: 'Timeout',
    icon: XCircle,
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
};

function RequestCard({ 
  request, 
  onExperimentClick 
}: { 
  request: ExperimentRequest; 
  onExperimentClick?: (id: string) => void;
}) {
  const config = statusConfig[request.status];
  const StatusIcon = config.icon;
  const goal = request.parameters?.goal || 'Untitled Request';
  const userName = request.profile?.display_name || request.profile?.email?.split('@')[0];

  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* User info */}
      {userName && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
          <Avatar className="h-5 w-5">
            <AvatarImage src={request.profile?.avatar_url || undefined} />
            <AvatarFallback className="text-[10px]">
              {userName[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{userName}</span> ran this experiment
          </span>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{goal}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn("shrink-0 gap-1", config.className)}
        >
          <StatusIcon className={cn("w-3 h-3", config.iconClassName)} />
          {config.label}
        </Badge>
      </div>
      
      {request.error_message && (
        <p className="text-xs text-red-500 mt-2 line-clamp-2">
          {request.error_message}
        </p>
      )}
      
      {request.status === 'completed' && request.experiment_id && onExperimentClick && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700"
          onClick={() => onExperimentClick(request.experiment_id!)}
        >
          View Experiment
          <ChevronRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

export function RequestQueue({ onExperimentClick }: RequestQueueProps) {
  const { 
    requests, 
    pendingRequests, 
    completedRequests, 
    failedRequests, 
    isLoading,
    refetch 
  } = useExperimentRequests();

  const [activeTab, setActiveTab] = useState('all');

  const getFilteredRequests = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRequests;
      case 'completed':
        return completedRequests;
      case 'failed':
        return failedRequests;
      default:
        return requests;
    }
  };

  const filteredRequests = getFilteredRequests();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Request Queue
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        {/* Summary badges */}
        <div className="flex gap-2 mt-2">
          {pendingRequests.length > 0 && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              {pendingRequests.length} pending
            </Badge>
          )}
          {completedRequests.length > 0 && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {completedRequests.length} completed
            </Badge>
          )}
          {failedRequests.length > 0 && (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
              {failedRequests.length} failed
            </Badge>
          )}
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Done</TabsTrigger>
            <TabsTrigger value="failed" className="flex-1">Failed</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="flex-1 pt-4">
          <TabsContent value={activeTab} className="mt-0 h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Activity className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No requests found
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Trigger a workflow to see requests here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 pr-4">
                  {filteredRequests.map((request) => (
                    <RequestCard 
                      key={request.id} 
                      request={request}
                      onExperimentClick={onExperimentClick}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
