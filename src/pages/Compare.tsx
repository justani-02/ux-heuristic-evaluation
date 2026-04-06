import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppNav } from "@/components/AppNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAllAnalyses,
  getAnalysis,
  computeValidationStatus,
  getResolvedIssues,
  getNewIssues,
  type AnalysisResult,
  type ValidationStatus,
} from "@/lib/api/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import { UXImprovementSummaryCard } from "@/components/UXImprovementSummaryCard";
import { FeedbackLoopFlow } from "@/components/FeedbackLoopFlow";
import { KPIInputForm } from "@/components/KPIInputForm";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompareArrows,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Validation Status Visual ── */
function ValidationBadge({ status }: { status: ValidationStatus }) {
  const config = {
    Improved: {
      icon: ShieldCheck,
      bg: "bg-[hsl(var(--severity-low))]/10",
      text: "text-[hsl(var(--severity-low))]",
      border: "border-[hsl(var(--severity-low))]/30",
      label: "Validated ✓",
    },
    "Partially Improved": {
      icon: ShieldQuestion,
      bg: "bg-[hsl(var(--severity-medium))]/10",
      text: "text-[hsl(var(--severity-medium))]",
      border: "border-[hsl(var(--severity-medium))]/30",
      label: "Partial Impact",
    },
    "No Impact": {
      icon: ShieldAlert,
      bg: "bg-[hsl(var(--severity-high))]/10",
      text: "text-[hsl(var(--severity-high))]",
      border: "border-[hsl(var(--severity-high))]/30",
      label: "No Impact",
    },
  }[status];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 border font-semibold text-sm", config.bg, config.text, config.border)}>
      <Icon className="w-5 h-5" />
      {config.label}
    </div>
  );
}

/* ── Score comparison bar row ── */
function ScoreBar({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  const improved = delta > 0;
  const regressed = delta < 0;

  return (
    <div className="space-y-1.5 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{before}</span>
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm font-bold tabular-nums">{after}</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 h-5 font-bold tabular-nums gap-0.5",
              improved && "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/40 bg-[hsl(var(--severity-low))]/5",
              regressed && "text-[hsl(var(--severity-high))] border-[hsl(var(--severity-high))]/40 bg-[hsl(var(--severity-high))]/5",
              !improved && !regressed && "text-muted-foreground"
            )}
          >
            {improved && <ArrowUpRight className="w-3 h-3" />}
            {regressed && <ArrowDownRight className="w-3 h-3" />}
            {delta > 0 ? "+" : ""}{delta}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 relative">
          <Progress value={before} className="h-2 bg-muted/60" />
        </div>
        <div className="flex-1 relative">
          <Progress value={after} className="h-2 bg-muted/60" />
        </div>
      </div>
      <div className="flex gap-1 text-[10px] text-muted-foreground">
        <span className="flex-1">Before</span>
        <span className="flex-1">After</span>
      </div>
    </div>
  );
}

/* ── KPI Delta Row ── */
function KPIDeltaRow({ label, before, after, invert = false }: { label: string; before: number | null; after: number | null; invert?: boolean }) {
  if (before == null || after == null) return null;
  const raw = after - before;
  const good = invert ? raw < 0 : raw > 0;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">{before.toFixed(1)}%</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground" />
        <span className="text-sm font-semibold tabular-nums">{after.toFixed(1)}%</span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 font-bold tabular-nums gap-0.5",
            good && "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/40 bg-[hsl(var(--severity-low))]/5",
            !good && raw !== 0 && "text-[hsl(var(--severity-high))] border-[hsl(var(--severity-high))]/40 bg-[hsl(var(--severity-high))]/5",
            raw === 0 && "text-muted-foreground"
          )}
        >
          {good && <ArrowUpRight className="w-3 h-3" />}
          {!good && raw !== 0 && <ArrowDownRight className="w-3 h-3" />}
          {raw > 0 ? "+" : ""}{raw.toFixed(1)}%
        </Badge>
      </div>
    </div>
  );
}

export default function Compare() {
  const { user } = useAuth();
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

  const hasKPIs = baseline && updated && (
    baseline.conversion_rate != null || updated.conversion_rate != null ||
    baseline.bounce_rate != null || updated.bounce_rate != null
  );

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

        {!user ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <GitCompareArrows className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Log in to view your past analyses</h3>
              <p className="text-sm text-muted-foreground mb-4">Sign in to compare and validate your UX improvements.</p>
              <Link to="/auth" className="text-primary hover:underline text-sm font-medium">Sign in →</Link>
            </CardContent>
          </Card>
        ) : loading ? (
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
            {/* ── Analysis Selectors ── */}
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end mb-10">
              <Card className="border-border/50 border-l-4 border-l-muted-foreground/30">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-widest">Before (Baseline)</p>
                  <Select value={baselineId} onValueChange={setBaselineId}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select baseline" /></SelectTrigger>
                    <SelectContent>
                      {analyses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.page_title || a.url} — {a.overall_score} pts ({new Date(a.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {baseline && (
                    <div className="mt-3 flex items-center gap-3">
                      <ScoreRing score={baseline.overall_score || 0} size={48} strokeWidth={4} />
                      <div>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{baseline.url}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(baseline.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="hidden md:flex items-center justify-center pb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GitCompareArrows className="w-5 h-5 text-primary" />
                </div>
              </div>

              <Card className="border-border/50 border-l-4 border-l-primary/50">
                <CardContent className="p-4">
                  <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-widest">After (Updated)</p>
                  <Select value={updatedId} onValueChange={setUpdatedId}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select updated" /></SelectTrigger>
                    <SelectContent>
                      {analyses.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.page_title || a.url} — {a.overall_score} pts ({new Date(a.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {updated && (
                    <div className="mt-3 flex items-center gap-3">
                      <ScoreRing score={updated.overall_score || 0} size={48} strokeWidth={4} />
                      <div>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{updated.url}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(updated.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {baseline && updated && (
              <>
                {/* ── Hero: Score Change + Validation ── */}
                <Card className="border-border/50 mb-8 overflow-hidden">
                  <div className="grid md:grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-0">
                    {/* Before score */}
                    <div className="p-6 text-center bg-muted/20">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Before</p>
                      <ScoreRing score={baseline.overall_score || 0} size={100} strokeWidth={7} />
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:flex items-center justify-center px-2">
                      <div className="flex flex-col items-center gap-1">
                        <ArrowRight className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    </div>

                    {/* After score */}
                    <div className="p-6 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-semibold">After</p>
                      <ScoreRing score={updated.overall_score || 0} size={100} strokeWidth={7} />
                    </div>

                    <Separator orientation="vertical" className="hidden md:block h-20" />

                    {/* Delta + Validation */}
                    <div className="p-6 flex flex-col items-center gap-3">
                      {(() => {
                        const d = (updated.overall_score || 0) - (baseline.overall_score || 0);
                        return (
                          <div className={cn(
                            "text-center",
                            d > 0 ? "text-[hsl(var(--severity-low))]" : d < 0 ? "text-[hsl(var(--severity-high))]" : "text-muted-foreground"
                          )}>
                            <div className="flex items-center gap-1 justify-center">
                              {d > 0 ? <TrendingUp className="w-6 h-6" /> : d < 0 ? <TrendingDown className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
                              <span className="text-3xl font-bold tabular-nums">{d > 0 ? "+" : ""}{d}</span>
                            </div>
                            <p className="text-xs mt-0.5">points</p>
                          </div>
                        );
                      })()}
                      {validationStatus && <ValidationBadge status={validationStatus} />}
                    </div>
                  </div>
                </Card>

                <UXImprovementSummaryCard baseline={baseline} updated={updated} />

                {/* ── Score Breakdown ── */}
                <Card className="border-border/50 mb-8">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Sub-Score Changes</CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/20">
                    <ScoreBar label="Navigation Clarity" before={baseline.navigation_clarity_score || 0} after={updated.navigation_clarity_score || 0} />
                    <ScoreBar label="Information Hierarchy" before={baseline.information_hierarchy_score || 0} after={updated.information_hierarchy_score || 0} />
                    <ScoreBar label="Feedback Visibility" before={baseline.feedback_visibility_score || 0} after={updated.feedback_visibility_score || 0} />
                    <ScoreBar label="Error Prevention" before={baseline.error_prevention_score || 0} after={updated.error_prevention_score || 0} />
                    <ScoreBar label="Interaction Efficiency" before={baseline.interaction_efficiency_score || 0} after={updated.interaction_efficiency_score || 0} />
                  </CardContent>
                </Card>

                {/* ── KPI Comparison ── */}
                <div className="grid md:grid-cols-[1fr_1fr] gap-6 mb-8">
                  <div className="space-y-6">
                    <KPIInputForm analysis={baseline} onUpdated={(a) => setBaseline(a)} label="Baseline KPIs" />
                  </div>
                  <div className="space-y-6">
                    <KPIInputForm analysis={updated} onUpdated={(a) => setUpdated(a)} label="Updated KPIs" />
                  </div>
                </div>

                {/* KPI Delta Summary */}
                {hasKPIs && (
                  <Card className="border-border/50 mb-8">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        KPI Impact Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <KPIDeltaRow label="Conversion Rate" before={baseline.conversion_rate} after={updated.conversion_rate} />
                      <KPIDeltaRow label="Bounce Rate" before={baseline.bounce_rate} after={updated.bounce_rate} invert />
                      <KPIDeltaRow label="Task Completion" before={baseline.task_completion_rate} after={updated.task_completion_rate} />
                      <KPIDeltaRow label="Drop-off Rate" before={baseline.drop_off_rate} after={updated.drop_off_rate} invert />
                    </CardContent>
                  </Card>
                )}

                {/* ── Resolved & New Issues ── */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="border-border/50 border-t-4 border-t-[hsl(var(--severity-low))]/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[hsl(var(--severity-low))]" />
                        Resolved
                        <Badge variant="secondary" className="text-xs ml-auto">{resolved.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                      {resolved.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No issues resolved yet.</p>
                      ) : resolved.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(var(--severity-low))]/5 border border-[hsl(var(--severity-low))]/15">
                          <CheckCircle2 className="w-4 h-4 text-[hsl(var(--severity-low))] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{r.issue}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{r.heuristic_name}</Badge>
                              <SeverityBadge severity={r.severity} />
                              {r.kpi_impact && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{r.kpi_impact}</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 border-t-4 border-t-[hsl(var(--severity-high))]/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-[hsl(var(--severity-high))]" />
                        New Issues
                        <Badge variant="secondary" className="text-xs ml-auto">{newIssues.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                      {newIssues.length === 0 ? (
                        <div className="text-center py-4">
                          <CheckCircle2 className="w-8 h-8 text-[hsl(var(--severity-low))]/40 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No new issues introduced!</p>
                        </div>
                      ) : newIssues.map((r, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-[hsl(var(--severity-high))]/5 border border-[hsl(var(--severity-high))]/15">
                          <AlertTriangle className="w-4 h-4 text-[hsl(var(--severity-high))] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-2">{r.issue}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{r.heuristic_name}</Badge>
                              <SeverityBadge severity={r.severity} />
                              {r.kpi_impact && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{r.kpi_impact}</Badge>}
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
