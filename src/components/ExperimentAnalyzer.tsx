import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, TrendingUp, Target, Lightbulb, AlertTriangle, CheckCircle2, X, Save, History, Trash2, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Experiment } from "@/hooks/useExperiments";
import { useExperimentAnalyses, Analysis, SavedAnalysis } from "@/hooks/useExperimentAnalyses";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExperimentAnalyzerProps {
  experiments: Experiment[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExperimentAnalyzer({ experiments, isOpen, onClose }: ExperimentAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSavedAnalysis, setSelectedSavedAnalysis] = useState<SavedAnalysis | null>(null);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const { analyses, saveAnalysis, deleteAnalysis } = useExperimentAnalyses();

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
    setSelectedSavedAnalysis(null);

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
      setAnalysisTitle(`Analysis - ${new Date().toLocaleDateString()}`);
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

  const handleSaveAnalysis = async () => {
    if (!analysis) return;
    const experimentIds = experiments.map(e => e.id);
    await saveAnalysis(analysis, experimentIds, analysisTitle || undefined);
  };

  const handleLoadAnalysis = (saved: SavedAnalysis) => {
    setSelectedSavedAnalysis(saved);
    setAnalysis(saved.analysis);
    setAnalysisTitle(saved.title);
    setShowHistory(false);
  };

  const handleDeleteAnalysis = async () => {
    if (analysisToDelete) {
      await deleteAnalysis(analysisToDelete);
      if (selectedSavedAnalysis?.id === analysisToDelete) {
        setSelectedSavedAnalysis(null);
        setAnalysis(null);
      }
      setAnalysisToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const currentAnalysis = analysis;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-4 md:inset-10 overflow-auto bg-background border rounded-lg shadow-lg">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showHistory && (
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">
                {showHistory ? "Analysis History" : "Experiment Insights Analyzer"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {showHistory 
                  ? `${analyses.length} saved analyses`
                  : `AI-powered analysis of ${experiments.length} experiments`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showHistory && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistory(true)}
                  className="gap-2"
                >
                  <History className="h-4 w-4" />
                  History ({analyses.length})
                </Button>
                <Button onClick={runAnalysis} disabled={isLoading || experiments.length < 2}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      {analysis ? "Re-analyze" : "Analyze"}
                    </>
                  )}
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {showHistory ? (
            <div className="space-y-4">
              {analyses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Saved Analyses</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Run an analysis and save it to view it here later.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="space-y-3">
                    {analyses.map((saved) => (
                      <Card 
                        key={saved.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleLoadAnalysis(saved)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{saved.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {saved.experiment_count} experiments • {formatDistanceToNow(new Date(saved.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnalysisToDelete(saved.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <>
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

              {!currentAnalysis && !isLoading && !error && (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Click "Analyze" to discover patterns in your experiments 
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

              {currentAnalysis && (
                <div className="space-y-6">
                  {/* Save Bar */}
                  {!selectedSavedAnalysis && (
                    <Card className="bg-muted/30">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Input
                            placeholder="Analysis title..."
                            value={analysisTitle}
                            onChange={(e) => setAnalysisTitle(e.target.value)}
                            className="max-w-xs"
                          />
                          <Button onClick={handleSaveAnalysis} className="gap-2">
                            <Save className="h-4 w-4" />
                            Save Analysis
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedSavedAnalysis && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            <span className="font-medium">{selectedSavedAnalysis.title}</span>
                            <Badge variant="secondary">
                              {selectedSavedAnalysis.experiment_count} experiments
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Saved {formatDistanceToNow(new Date(selectedSavedAnalysis.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Overall Insights */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Key Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg">{currentAnalysis.overallInsights}</p>
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
                        {currentAnalysis.topRecommendations.map((rec, i) => (
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
                          {currentAnalysis.contextPatterns.findings.map((finding, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium text-primary">
                            💡 {currentAnalysis.contextPatterns.recommendation}
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
                          {currentAnalysis.promptPatterns.findings.map((finding, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              {finding}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium text-primary">
                            💡 {currentAnalysis.promptPatterns.recommendation}
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
                          {currentAnalysis.successFactors.map((factor, i) => (
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
                          {currentAnalysis.improvementAreas.map((area, i) => (
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
                          <p className="text-sm">{currentAnalysis.ratingCorrelations.highRatedCommonalities}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <h4 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Low-Rated Experiments
                          </h4>
                          <p className="text-sm">{currentAnalysis.ratingCorrelations.lowRatedCommonalities}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnalysis} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
