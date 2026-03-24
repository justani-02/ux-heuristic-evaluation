import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import {
  getAllAnalyses,
  getAnalysis,
  computeValidationStatus,
  getResolvedIssues,
  getNewIssues,
  type AnalysisResult,
} from "@/lib/api/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UXImprovementSummaryCard } from "@/components/UXImprovementSummaryCard";
import { FeedbackLoopFlow } from "@/components/FeedbackLoopFlow";
import { KPIInputForm } from "@/components/KPIInputForm";
import { ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreDelta({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{before}</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-sm font-bold">{after}</span>
        <span className={cn(
          "text-xs font-bold min-w-[40px] text-right",
          delta > 0 ? "text-[hsl(var(--severity-low))]" : delta < 0 ? "text-[hsl(var(--severity-high))]" : "text-muted-foreground"
        )}>
          {delta > 0 ? "+" : ""}{delta}
        </span>
      </div>
    </div>
  );
}

export default function Compare() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [baselineId, setBaselineId] = useState<string>("");
  const [updatedId, setUpdatedId] = useState<string>("");
  const [baseline, setBaseline] = useState<AnalysisResult | null>(null);
  const [updated, setUpdated] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    getAllAnalyses().then((data) => {
      setAnalyses(data);
      setLoading(false);
      if (data.length >= 2) {
        setBaselineId(data[data.length - 2].id);
        setUpdatedId(data[data.length - 1].id);
      }
    });
  }, []);

  useEffect(() => {
    if (baselineId) getAnalysis(baselineId).then(setBaseline);
    else setBaseline(null);
  }, [baselineId]);

  useEffect(() => {
    if (updatedId) getAnalysis(updatedId).then(setUpdated);
    else setUpdated(null);
  }, [updatedId]);

  const resolved = baseline && updated ? getResolvedIssues(baseline, updated) : [];
  const newIssues = baseline && updated ? getNewIssues(baseline, updated) : [];
  const validationStatus = baseline && updated ? computeValidationStatus(baseline, updated) : null;

  const statusColor = validationStatus === "Improved"
    ? "text-[hsl(var(--severity-low))] bg-[hsl(var(--severity-low))]/10"
    : validationStatus === "Partially Improved"
    ? "text-[hsl(var(--severity-medium))] bg-[hsl(var(--severity-medium))]/10"
    : "text-[hsl(var(--severity-high))] bg-[hsl(var(--severity-high))]/10";

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Compare & Validate</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compare analyses to validate whether fixes improved UX and business outcomes
          </p>
        </div>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-64" /></div>
        ) : analyses.length < 2 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <GitCompareArrows className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Need at least 2 analyses</h3>
              <p className="text-sm text-muted-foreground">Run multiple UX analyses to compare results.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Selectors */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Baseline (Before)</p>
                  <Select value={baselineId} onValueChange={setBaselineId}>
                    <SelectTrigger><SelectValue placeholder="Select baseline" /></SelectTrigger>
                    <SelectContent>
                      {analyses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.page_title || a.url} — Score: {a.overall_score} ({new Date(a.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Updated (After)</p>
                  <Select value={updatedId} onValueChange={setUpdatedId}>
                    <SelectTrigger><SelectValue placeholder="Select updated" /></SelectTrigger>
                    <SelectContent>
                      {analyses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.page_title || a.url} — Score: {a.overall_score} ({new Date(a.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {baseline && updated && (
              <>
                {/* Validation Status */}
                {validationStatus && (
                  <Card className="border-border/50 mb-8">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Validation Status</p>
                        <Badge className={cn("text-sm px-3 py-1", statusColor)}>{validationStatus}</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <p className="text-3xl font-bold">{baseline.overall_score || 0}</p>
                          <p className="text-xs text-muted-foreground">Before</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-3xl font-bold">{updated.overall_score || 0}</p>
                          <p className="text-xs text-muted-foreground">After</p>
                        </div>
                        {(() => {
                          const d = (updated.overall_score || 0) - (baseline.overall_score || 0);
                          return (
                            <div className={cn("flex items-center gap-1",
                              d > 0 ? "text-[hsl(var(--severity-low))]" : d < 0 ? "text-[hsl(var(--severity-high))]" : "text-muted-foreground"
                            )}>
                              {d > 0 ? <TrendingUp className="w-5 h-5" /> : d < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                              <span className="text-xl font-bold">{d > 0 ? "+" : ""}{d}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <UXImprovementSummaryCard baseline={baseline} updated={updated} />

                {/* Score Breakdown */}
                <Card className="border-border/50 mb-8">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/30">
                    <ScoreDelta label="Overall" before={baseline.overall_score || 0} after={updated.overall_score || 0} />
                    <ScoreDelta label="Navigation Clarity" before={baseline.navigation_clarity_score || 0} after={updated.navigation_clarity_score || 0} />
                    <ScoreDelta label="Information Hierarchy" before={baseline.information_hierarchy_score || 0} after={updated.information_hierarchy_score || 0} />
                    <ScoreDelta label="Feedback Visibility" before={baseline.feedback_visibility_score || 0} after={updated.feedback_visibility_score || 0} />
                    <ScoreDelta label="Error Prevention" before={baseline.error_prevention_score || 0} after={updated.error_prevention_score || 0} />
                    <ScoreDelta label="Interaction Efficiency" before={baseline.interaction_efficiency_score || 0} after={updated.interaction_efficiency_score || 0} />
                  </CardContent>
                </Card>

                {/* KPI Comparison */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <KPIInputForm analysis={baseline} onUpdated={(a) => setBaseline(a)} label="Baseline KPIs" />
                  <KPIInputForm analysis={updated} onUpdated={(a) => setUpdated(a)} label="Updated KPIs" />
                </div>

                {/* Resolved & New Issues */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--severity-low))]" />
                        Issues Resolved ({resolved.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {resolved.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No issues were resolved between these analyses.</p>
                      ) : resolved.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[hsl(var(--severity-low))]/5 border border-[hsl(var(--severity-low))]/20">
                          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--severity-low))] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{r.issue}</p>
                            <p className="text-xs text-muted-foreground">{r.heuristic_name}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[hsl(var(--severity-high))]" />
                        New Issues ({newIssues.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {newIssues.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No new issues were introduced.</p>
                      ) : newIssues.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-[hsl(var(--severity-high))]/5 border border-[hsl(var(--severity-high))]/20">
                          <AlertTriangle className="w-4 h-4 text-[hsl(var(--severity-high))] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{r.issue}</p>
                            <div className="flex gap-1.5 mt-1">
                              <SeverityBadge severity={r.severity} />
                              <Badge variant="outline" className="text-[10px]">{r.heuristic_name}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <FeedbackLoopFlow baseline={baseline} updated={updated} resolvedCount={resolved.length} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
