import { useState, useMemo } from 'react';
import { Experiment } from '@/hooks/useExperiments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeftRight, Star, X, Globe, Check, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ABComparisonProps {
  experiments: Experiment[];
  onBack: () => void;
}

interface ComparisonField {
  key: keyof Experiment;
  label: string;
  type: 'text' | 'rating' | 'multiline' | 'boolean';
}

const COMPARISON_FIELDS: ComparisonField[] = [
  { key: 'goal', label: 'Goal', type: 'text' },
  { key: 'mission', label: 'Mission', type: 'multiline' },
  { key: 'example', label: 'Example', type: 'multiline' },
  { key: 'desired', label: 'Desired Output', type: 'multiline' },
  { key: 'rules', label: 'Rules', type: 'multiline' },
  { key: 'board_name', label: 'Board Name', type: 'text' },
  { key: 'board_pulled_context', label: 'Board Pulled Context', type: 'multiline' },
  { key: 'search_terms', label: 'Search Terms', type: 'text' },
  { key: 'search_context', label: 'Search Context', type: 'multiline' },
  { key: 'use_websearch', label: 'Web Search', type: 'boolean' },
  { key: 'agentic_prompt', label: 'Agentic Prompt', type: 'multiline' },
  { key: 'output', label: 'Output', type: 'multiline' },
  { key: 'rating', label: 'Rating', type: 'rating' },
  { key: 'notes', label: 'Notes', type: 'multiline' },
];

type ComparableValue = string | number | boolean | null | undefined;

function getDiffStatus(valA: ComparableValue, valB: ComparableValue): 'same' | 'different' | 'only-a' | 'only-b' {
  const aEmpty = valA === null || valA === undefined || valA === '';
  const bEmpty = valB === null || valB === undefined || valB === '';
  
  if (aEmpty && bEmpty) return 'same';
  if (aEmpty && !bEmpty) return 'only-b';
  if (!aEmpty && bEmpty) return 'only-a';
  if (valA === valB) return 'same';
  return 'different';
}

function RatingStars({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span className="text-muted-foreground">Not rated</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          )}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );
}

function FieldValue({ value, type, diffStatus }: { 
  value: ComparableValue; 
  type: 'text' | 'rating' | 'multiline' | 'boolean';
  diffStatus: 'same' | 'different' | 'only-a' | 'only-b';
}) {
  const isEmpty = value === null || value === undefined || value === '';
  
  if (type === 'boolean') {
    const isEnabled = value === true;
    return (
      <div className={cn(
        "p-2 rounded-md border border-border/50 bg-muted/30 flex items-center gap-2",
        diffStatus === 'different' && 'bg-amber-500/10 border-amber-500/30'
      )}>
        {isEnabled ? (
          <>
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-500 font-medium">Enabled</span>
          </>
        ) : (
          <>
            <XIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Disabled</span>
          </>
        )}
      </div>
    );
  }
  
  if (type === 'rating') {
    return <RatingStars rating={value as number | null} />;
  }
  
  if (isEmpty) {
    return <span className="text-muted-foreground italic">Empty</span>;
  }
  
  const bgClass = diffStatus === 'different' 
    ? 'bg-amber-500/10 border-amber-500/30' 
    : diffStatus === 'only-a' || diffStatus === 'only-b'
    ? 'bg-blue-500/10 border-blue-500/30'
    : '';
  
  if (type === 'multiline') {
    return (
      <div className={cn("p-3 rounded-md border border-border/50 bg-muted/30", bgClass)}>
        <pre className="whitespace-pre-wrap text-sm font-mono">{String(value)}</pre>
      </div>
    );
  }
  
  return (
    <div className={cn("p-2 rounded-md border border-border/50 bg-muted/30", bgClass)}>
      <span className="text-sm">{String(value)}</span>
    </div>
  );
}

export function ABComparison({ experiments, onBack }: ABComparisonProps) {
  const [experimentA, setExperimentA] = useState<string | null>(null);
  const [experimentB, setExperimentB] = useState<string | null>(null);
  
  const expA = useMemo(() => experiments.find(e => e.id === experimentA), [experiments, experimentA]);
  const expB = useMemo(() => experiments.find(e => e.id === experimentB), [experiments, experimentB]);
  
  const diffSummary = useMemo(() => {
    if (!expA || !expB) return { same: 0, different: 0 };
    
    let same = 0;
    let different = 0;
    
    COMPARISON_FIELDS.forEach(field => {
      const valA = expA[field.key] as ComparableValue;
      const valB = expB[field.key] as ComparableValue;
      const status = getDiffStatus(valA, valB);
      if (status === 'same') same++;
      else different++;
    });
    
    return { same, different };
  }, [expA, expB]);

  const swapExperiments = () => {
    const temp = experimentA;
    setExperimentA(experimentB);
    setExperimentB(temp);
  };

  return (
    <div className="space-y-6">
      {/* Selection Header */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">A/B Comparison</CardTitle>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Experiment A</label>
              <Select value={experimentA || ''} onValueChange={setExperimentA}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select experiment A" />
                </SelectTrigger>
                <SelectContent>
                  {experiments.map(exp => (
                    <SelectItem 
                      key={exp.id} 
                      value={exp.id}
                      disabled={exp.id === experimentB}
                    >
                      {exp.name} {exp.rating && `(${exp.rating}★)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={swapExperiments}
              disabled={!experimentA || !experimentB}
              className="shrink-0 mt-6 sm:mt-0"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Experiment B</label>
              <Select value={experimentB || ''} onValueChange={setExperimentB}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select experiment B" />
                </SelectTrigger>
                <SelectContent>
                  {experiments.map(exp => (
                    <SelectItem 
                      key={exp.id} 
                      value={exp.id}
                      disabled={exp.id === experimentA}
                    >
                      {exp.name} {exp.rating && `(${exp.rating}★)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {expA && expB && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
              <Badge variant="outline" className="bg-muted/50">
                {diffSummary.same} matching fields
              </Badge>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                {diffSummary.different} differences
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Content */}
      {expA && expB ? (
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-6 pr-4">
            {COMPARISON_FIELDS.map(field => {
              const valA = expA[field.key] as ComparableValue;
              const valB = expB[field.key] as ComparableValue;
              const diffStatus = getDiffStatus(valA, valB);
              
              return (
                <div key={field.key} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className={cn(
                    "bg-card/50 backdrop-blur-sm border-border/50",
                    diffStatus === 'different' && "ring-1 ring-amber-500/30",
                    diffStatus === 'only-a' && "ring-1 ring-blue-500/30"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                        {diffStatus !== 'same' && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              diffStatus === 'different' && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                              diffStatus === 'only-a' && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                              diffStatus === 'only-b' && "bg-muted text-muted-foreground"
                            )}
                          >
                            {diffStatus === 'different' ? 'Different' : diffStatus === 'only-a' ? 'Only in A' : 'Missing'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FieldValue value={valA} type={field.type} diffStatus={diffStatus} />
                    </CardContent>
                  </Card>
                  
                  <Card className={cn(
                    "bg-card/50 backdrop-blur-sm border-border/50",
                    diffStatus === 'different' && "ring-1 ring-amber-500/30",
                    diffStatus === 'only-b' && "ring-1 ring-blue-500/30"
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{field.label}</CardTitle>
                        {diffStatus !== 'same' && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs",
                              diffStatus === 'different' && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                              diffStatus === 'only-b' && "bg-blue-500/10 text-blue-600 border-blue-500/30",
                              diffStatus === 'only-a' && "bg-muted text-muted-foreground"
                            )}
                          >
                            {diffStatus === 'different' ? 'Different' : diffStatus === 'only-b' ? 'Only in B' : 'Missing'}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FieldValue value={valB} type={field.type} diffStatus={diffStatus} />
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select two experiments to compare</p>
              <p className="text-sm mt-1">Choose experiments from the dropdowns above</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
