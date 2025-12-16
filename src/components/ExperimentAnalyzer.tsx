import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, TrendingUp, Target, Lightbulb, AlertTriangle, CheckCircle2, Save, History, Trash2, ChevronLeft, GitCompareArrows, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Experiment } from "@/hooks/useExperiments";
import { useExperimentAnalyses, Analysis, SavedAnalysis } from "@/hooks/useExperimentAnalyses";
import { useAnalysisAnnotations } from "@/hooks/useAnalysisAnnotations";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnalysisComparison } from "@/components/AnalysisComparison";
import { AnnotatableAnalysisText } from "@/components/annotations/AnnotatableAnalysisText";
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
}

type ViewMode = 'analyzer' | 'history' | 'compare-select' | 'compare-view';

export function ExperimentAnalyzer({ experiments }: ExperimentAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('analyzer');
  const [selectedSavedAnalysis, setSelectedSavedAnalysis] = useState<SavedAnalysis | null>(null);
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const { toast } = useToast();
  const { analyses, saveAnalysis, deleteAnalysis } = useExperimentAnalyses();
  const { 
    annotations: analysisAnnotations, 
    createAnnotation: createAnalysisAnnotation,
    updateAnnotation: updateAnalysisAnnotation,
    deleteAnnotation: deleteAnalysisAnnotation,
    getAnnotationsForField 
  } = useAnalysisAnnotations(selectedSavedAnalysis?.id);

  // Load the latest analysis on mount
  useEffect(() => {
    if (analyses.length > 0 && !analysis && !selectedSavedAnalysis) {
      const latest = analyses[0]; // analyses are ordered by created_at desc
      setSelectedSavedAnalysis(latest);
      setAnalysis(latest.analysis);
      setAnalysisTitle(latest.title);
    }
  }, [analyses]);

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
    setViewMode('analyzer');
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

  const handleToggleCompareSelection = (id: string) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id]; // Replace oldest selection
      }
      return [...prev, id];
    });
  };

  const handleStartComparison = () => {
    if (compareSelection.length === 2) {
      setViewMode('compare-view');
    }
  };

  const getSelectedAnalyses = () => {
    return compareSelection
      .map(id => analyses.find(a => a.id === id))
      .filter((a): a is SavedAnalysis => a !== undefined);
  };

  const currentAnalysis = analysis;

  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'history': return 'Analysis History';
      case 'compare-select': return 'Compare Analyses';
      case 'compare-view': return 'Analysis Comparison';
      default: return 'Experiment Insights Analyzer';
    }
  };

  const getHeaderSubtitle = () => {
    switch (viewMode) {
      case 'history': return `${analyses.length} saved analyses`;
      case 'compare-select': return `Select 2 analyses to compare (${compareSelection.length}/2 selected)`;
      case 'compare-view': return 'Side-by-side comparison of insights';
      default: return `AI-powered analysis of ${experiments.length} experiments`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {viewMode !== 'analyzer' && (
            <Button variant="ghost" size="icon" onClick={() => {
              if (viewMode === 'compare-view') {
                setViewMode('compare-select');
              } else {
                setViewMode('analyzer');
                setCompareSelection([]);
              }
            }}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">{getHeaderTitle()}</h2>
            <p className="text-sm text-muted-foreground">{getHeaderSubtitle()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'analyzer' && (
            <>
              {analyses.length >= 2 && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCompareSelection([]);
                    setViewMode('compare-select');
                  }}
                  className="gap-2"
                >
                  <GitCompareArrows className="h-4 w-4" />
                  Compare
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setViewMode('history')}
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
          {viewMode === 'compare-select' && (
            <Button 
              onClick={handleStartComparison} 
              disabled={compareSelection.length !== 2}
            >
              <GitCompareArrows className="mr-2 h-4 w-4" />
              Compare Selected
            </Button>
          )}
        </div>
      </div>

        <div>
          {/* History View */}
          {viewMode === 'history' && (
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
          )}

          {/* Compare Selection View */}
          {viewMode === 'compare-select' && (
            <div className="space-y-4">
              {analyses.length < 2 ? (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <GitCompareArrows className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Not Enough Analyses</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        You need at least 2 saved analyses to compare them.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <div className="space-y-3">
                    {analyses.map((saved, index) => {
                      const isSelected = compareSelection.includes(saved.id);
                      const selectionIndex = compareSelection.indexOf(saved.id);
                      return (
                        <Card 
                          key={saved.id} 
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleToggleCompareSelection(saved.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary/50">
                                {isSelected && (
                                  <Badge variant="default" className="h-6 w-6 p-0 flex items-center justify-center">
                                    {selectionIndex === 0 ? 'A' : 'B'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{saved.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {saved.experiment_count} experiments • {formatDistanceToNow(new Date(saved.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Compare View */}
          {viewMode === 'compare-view' && compareSelection.length === 2 && (
            <AnalysisComparison 
              analysisA={getSelectedAnalyses()[0]} 
              analysisB={getSelectedAnalyses()[1]} 
            />
          )}

          {/* Analyzer View */}
          {viewMode === 'analyzer' && (
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
                        {selectedSavedAnalysis && (
                          <Badge variant="outline" className="ml-auto text-xs font-normal">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Select text to annotate
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedSavedAnalysis ? (
                        <AnnotatableAnalysisText
                          content={currentAnalysis.overallInsights}
                          fieldName="overallInsights"
                          analysisId={selectedSavedAnalysis.id}
                          annotations={getAnnotationsForField('overallInsights')}
                          onCreateAnnotation={createAnalysisAnnotation}
                          onUpdateAnnotation={updateAnalysisAnnotation}
                          onDeleteAnnotation={deleteAnalysisAnnotation}
                          className="text-lg"
                        />
                      ) : (
                        <p className="text-lg">{currentAnalysis.overallInsights}</p>
                      )}
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
                            {selectedSavedAnalysis ? (
                              <AnnotatableAnalysisText
                                content={rec.description}
                                fieldName={`recommendation-${i}`}
                                analysisId={selectedSavedAnalysis.id}
                                annotations={getAnnotationsForField(`recommendation-${i}`)}
                                onCreateAnnotation={createAnalysisAnnotation}
                                onUpdateAnnotation={updateAnalysisAnnotation}
                                onDeleteAnnotation={deleteAnalysisAnnotation}
                                className="text-sm text-muted-foreground"
                              />
                            ) : (
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            )}
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
                              {selectedSavedAnalysis ? (
                                <AnnotatableAnalysisText
                                  content={finding}
                                  fieldName={`contextPatterns-finding-${i}`}
                                  analysisId={selectedSavedAnalysis.id}
                                  annotations={getAnnotationsForField(`contextPatterns-finding-${i}`)}
                                  onCreateAnnotation={createAnalysisAnnotation}
                                  onUpdateAnnotation={updateAnalysisAnnotation}
                                  onDeleteAnnotation={deleteAnalysisAnnotation}
                                  className=""
                                />
                              ) : (
                                <span>{finding}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-3 border-t">
                          {selectedSavedAnalysis ? (
                            <div className="text-sm font-medium text-primary flex items-start gap-1">
                              <span>💡</span>
                              <AnnotatableAnalysisText
                                content={currentAnalysis.contextPatterns.recommendation}
                                fieldName="contextPatterns-recommendation"
                                analysisId={selectedSavedAnalysis.id}
                                annotations={getAnnotationsForField('contextPatterns-recommendation')}
                                onCreateAnnotation={createAnalysisAnnotation}
                                onUpdateAnnotation={updateAnalysisAnnotation}
                                onDeleteAnnotation={deleteAnalysisAnnotation}
                                className=""
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-primary">
                              💡 {currentAnalysis.contextPatterns.recommendation}
                            </p>
                          )}
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
                              {selectedSavedAnalysis ? (
                                <AnnotatableAnalysisText
                                  content={finding}
                                  fieldName={`promptPatterns-finding-${i}`}
                                  analysisId={selectedSavedAnalysis.id}
                                  annotations={getAnnotationsForField(`promptPatterns-finding-${i}`)}
                                  onCreateAnnotation={createAnalysisAnnotation}
                                  onUpdateAnnotation={updateAnalysisAnnotation}
                                  onDeleteAnnotation={deleteAnalysisAnnotation}
                                  className=""
                                />
                              ) : (
                                <span>{finding}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="pt-3 border-t">
                          {selectedSavedAnalysis ? (
                            <div className="text-sm font-medium text-primary flex items-start gap-1">
                              <span>💡</span>
                              <AnnotatableAnalysisText
                                content={currentAnalysis.promptPatterns.recommendation}
                                fieldName="promptPatterns-recommendation"
                                analysisId={selectedSavedAnalysis.id}
                                annotations={getAnnotationsForField('promptPatterns-recommendation')}
                                onCreateAnnotation={createAnalysisAnnotation}
                                onUpdateAnnotation={updateAnalysisAnnotation}
                                onDeleteAnnotation={deleteAnalysisAnnotation}
                                className=""
                              />
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-primary">
                              💡 {currentAnalysis.promptPatterns.recommendation}
                            </p>
                          )}
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
                              {selectedSavedAnalysis ? (
                                <AnnotatableAnalysisText
                                  content={factor}
                                  fieldName={`successFactor-${i}`}
                                  analysisId={selectedSavedAnalysis.id}
                                  annotations={getAnnotationsForField(`successFactor-${i}`)}
                                  onCreateAnnotation={createAnalysisAnnotation}
                                  onUpdateAnnotation={updateAnalysisAnnotation}
                                  onDeleteAnnotation={deleteAnalysisAnnotation}
                                  className=""
                                />
                              ) : (
                                <span>{factor}</span>
                              )}
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
                              {selectedSavedAnalysis ? (
                                <AnnotatableAnalysisText
                                  content={area}
                                  fieldName={`improvementArea-${i}`}
                                  analysisId={selectedSavedAnalysis.id}
                                  annotations={getAnnotationsForField(`improvementArea-${i}`)}
                                  onCreateAnnotation={createAnalysisAnnotation}
                                  onUpdateAnnotation={updateAnalysisAnnotation}
                                  onDeleteAnnotation={deleteAnalysisAnnotation}
                                  className=""
                                />
                              ) : (
                                <span>{area}</span>
                              )}
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
                          {selectedSavedAnalysis ? (
                            <AnnotatableAnalysisText
                              content={currentAnalysis.ratingCorrelations.highRatedCommonalities}
                              fieldName="highRatedCommonalities"
                              analysisId={selectedSavedAnalysis.id}
                              annotations={getAnnotationsForField('highRatedCommonalities')}
                              onCreateAnnotation={createAnalysisAnnotation}
                              onUpdateAnnotation={updateAnalysisAnnotation}
                              onDeleteAnnotation={deleteAnalysisAnnotation}
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm">{currentAnalysis.ratingCorrelations.highRatedCommonalities}</p>
                          )}
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <h4 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Low-Rated Experiments
                          </h4>
                          {selectedSavedAnalysis ? (
                            <AnnotatableAnalysisText
                              content={currentAnalysis.ratingCorrelations.lowRatedCommonalities}
                              fieldName="lowRatedCommonalities"
                              analysisId={selectedSavedAnalysis.id}
                              annotations={getAnnotationsForField('lowRatedCommonalities')}
                              onCreateAnnotation={createAnalysisAnnotation}
                              onUpdateAnnotation={updateAnalysisAnnotation}
                              onDeleteAnnotation={deleteAnalysisAnnotation}
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-sm">{currentAnalysis.ratingCorrelations.lowRatedCommonalities}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
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
