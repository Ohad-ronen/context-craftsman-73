import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, Target, ArrowRight, Equal, Plus, Minus } from "lucide-react";
import { Analysis, SavedAnalysis } from "@/hooks/useExperimentAnalyses";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AnalysisComparisonProps {
  analysisA: SavedAnalysis;
  analysisB: SavedAnalysis;
}

function ComparisonHeader({ label, analysis }: { label: string; analysis: SavedAnalysis }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline">{label}</Badge>
        <span className="font-medium truncate">{analysis.title}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {analysis.experiment_count} experiments • {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
      </p>
    </div>
  );
}

function TextComparison({ labelA, labelB, textA, textB }: { labelA: string; labelB: string; textA: string; textB: string }) {
  const isSame = textA === textB;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={cn("p-3 rounded-lg border", isSame ? "bg-muted/30" : "bg-blue-500/5 border-blue-500/20")}>
        <Badge variant="outline" className="mb-2">{labelA}</Badge>
        <p className="text-sm">{textA}</p>
      </div>
      <div className={cn("p-3 rounded-lg border", isSame ? "bg-muted/30" : "bg-purple-500/5 border-purple-500/20")}>
        <Badge variant="outline" className="mb-2">{labelB}</Badge>
        <p className="text-sm">{textB}</p>
      </div>
    </div>
  );
}

function ListComparison({ 
  title, 
  listA, 
  listB,
  icon: Icon 
}: { 
  title: string; 
  listA: string[]; 
  listB: string[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  const onlyInA = listA.filter(item => !listB.includes(item));
  const onlyInB = listB.filter(item => !listA.includes(item));
  const inBoth = listA.filter(item => listB.includes(item));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {inBoth.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Equal className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">In both analyses</span>
            </div>
            <ul className="space-y-1">
              {inBoth.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {onlyInA.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Minus className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">Only in Analysis A</span>
            </div>
            <ul className="space-y-1">
              {onlyInA.map((item, i) => (
                <li key={i} className="text-sm text-blue-600/80 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {onlyInB.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Only in Analysis B</span>
            </div>
            <ul className="space-y-1">
              {onlyInB.map((item, i) => (
                <li key={i} className="text-sm text-purple-600/80 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationComparison({ 
  recsA, 
  recsB 
}: { 
  recsA: { title: string; description: string }[]; 
  recsB: { title: string; description: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Recommendations Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Analysis A</Badge>
            {recsA.map((rec, i) => (
              <div key={i} className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">{i + 1}</Badge>
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Analysis B</Badge>
            {recsB.map((rec, i) => (
              <div key={i} className="p-3 rounded-lg border bg-purple-500/5 border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">{i + 1}</Badge>
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalysisComparison({ analysisA, analysisB }: AnalysisComparisonProps) {
  const a = analysisA.analysis;
  const b = analysisB.analysis;

  return (
    <ScrollArea className="h-[calc(100vh-180px)]">
      <div className="space-y-6 pr-4">
        {/* Headers */}
        <div className="grid grid-cols-2 gap-4">
          <ComparisonHeader label="A" analysis={analysisA} />
          <ComparisonHeader label="B" analysis={analysisB} />
        </div>

        {/* Key Insights */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Key Insights Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TextComparison 
              labelA="Analysis A" 
              labelB="Analysis B" 
              textA={a.overallInsights} 
              textB={b.overallInsights} 
            />
          </CardContent>
        </Card>

        {/* Recommendations */}
        <RecommendationComparison 
          recsA={a.topRecommendations} 
          recsB={b.topRecommendations} 
        />

        {/* Pattern Comparisons */}
        <div className="grid grid-cols-2 gap-6">
          <ListComparison 
            title="Context Pattern Findings" 
            listA={a.contextPatterns.findings} 
            listB={b.contextPatterns.findings}
            icon={CheckCircle2}
          />
          <ListComparison 
            title="Prompt Pattern Findings" 
            listA={a.promptPatterns.findings} 
            listB={b.promptPatterns.findings}
            icon={CheckCircle2}
          />
        </div>

        {/* Success Factors & Improvement Areas */}
        <div className="grid grid-cols-2 gap-6">
          <ListComparison 
            title="Success Factors" 
            listA={a.successFactors} 
            listB={b.successFactors}
            icon={TrendingUp}
          />
          <ListComparison 
            title="Improvement Areas" 
            listA={a.improvementAreas} 
            listB={b.improvementAreas}
            icon={AlertTriangle}
          />
        </div>

        {/* Rating Correlations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Correlations Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                High-Rated Commonalities
              </h4>
              <TextComparison 
                labelA="Analysis A" 
                labelB="Analysis B" 
                textA={a.ratingCorrelations.highRatedCommonalities} 
                textB={b.ratingCorrelations.highRatedCommonalities} 
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low-Rated Commonalities
              </h4>
              <TextComparison 
                labelA="Analysis A" 
                labelB="Analysis B" 
                textA={a.ratingCorrelations.lowRatedCommonalities} 
                textB={b.ratingCorrelations.lowRatedCommonalities} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
