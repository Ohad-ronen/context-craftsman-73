import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, TrendingUp, Target, Lightbulb, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Experiment } from "@/hooks/useExperiments";

interface Analysis {
  overallInsights: string;
  contextPatterns: {
    findings: string[];
    recommendation: string;
  };
  promptPatterns: {
    findings: string[];
    recommendation: string;
  };
  successFactors: string[];
  improvementAreas: string[];
  topRecommendations: {
    title: string;
    description: string;
  }[];
  ratingCorrelations: {
    highRatedCommonalities: string;
    lowRatedCommonalities: string;
  };
}

interface ExperimentAnalyzerProps {
  experiments: Experiment[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExperimentAnalyzer({ experiments, isOpen, onClose }: ExperimentAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    if (experiments.length < 2) {
      toast({
        title: "Not enough experiments",
        description: "You need at least 2 experiments to run an analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('analyze-experiments', {
        body: { experiments }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your experiments and found insights.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to analyze experiments";
      setError(message);
      toast({
        title: "Analysis Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 overflow-auto bg-background border rounded-lg shadow-lg">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Experiment Insights Analyzer</h2>
              <p className="text-sm text-muted-foreground">
                AI-powered analysis of {experiments.length} experiments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={runAnalysis} disabled={isLoading || experiments.length < 2}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  {analysis ? "Re-analyze" : "Analyze Experiments"}
                </>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <Card className="border-destructive mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {!analysis && !isLoading && !error && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Click "Analyze Experiments" to discover patterns in your experiments 
                    and learn what leads to better AI outputs.
                  </p>
                  {experiments.length < 2 && (
                    <Badge variant="secondary">
                      Add at least 2 experiments to enable analysis
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analyzing Your Experiments</h3>
                  <p className="text-muted-foreground">
                    AI is examining patterns across {experiments.length} experiments...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Overall Insights */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{analysis.overallInsights}</p>
                </CardContent>
              </Card>

              {/* Top Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Recommendations
                  </CardTitle>
                  <CardDescription>Actionable steps to improve your experiments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {analysis.topRecommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{i + 1}</Badge>
                          <h4 className="font-medium">{rec.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Analysis */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Context Patterns</CardTitle>
                    <CardDescription>What context leads to better outputs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {analysis.contextPatterns.findings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-primary">
                        💡 {analysis.contextPatterns.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Prompt Patterns</CardTitle>
                    <CardDescription>What prompts produce best results</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {analysis.promptPatterns.findings.map((finding, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-primary">
                        💡 {analysis.promptPatterns.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Success Factors & Improvement Areas */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Success Factors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.successFactors.map((factor, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="mt-0.5 shrink-0 bg-green-500/10 text-green-600">
                            ✓
                          </Badge>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.improvementAreas.map((area, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant="secondary" className="mt-0.5 shrink-0 bg-amber-500/10 text-amber-600">
                            !
                          </Badge>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Rating Correlations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rating Correlations</CardTitle>
                  <CardDescription>What differentiates high and low rated experiments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        High-Rated Experiments
                      </h4>
                      <p className="text-sm">{analysis.ratingCorrelations.highRatedCommonalities}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <h4 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Low-Rated Experiments
                      </h4>
                      <p className="text-sm">{analysis.ratingCorrelations.lowRatedCommonalities}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
