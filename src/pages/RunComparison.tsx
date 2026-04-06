import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAnalysis,
  getAnalysisRuns,
  type AnalysisResult,
  type AnalysisRun,
  type HeuristicResult,
} from "@/lib/api/analysis";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Layers, CheckCircle2, XCircle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type ParsedRun = {
  run_index: number;
  overall_score: number;
  heuristic_results: HeuristicResult[];
  sub_scores: {
    navigation: number;
    hierarchy: number;
    feedback: number;
    error_prevention: number;
    efficiency: number;
  };
};

function parseRun(run: AnalysisRun): ParsedRun {
  const raw = run.raw_output || {};
  const results: HeuristicResult[] = raw.heuristic_results || [];
  return {
    run_index: run.run_index,
    overall_score: run.overall_score || raw.overall_score || 0,
    heuristic_results: results,
    sub_scores: {
      navigation: raw.navigation_clarity_score || 0,
      hierarchy: raw.information_hierarchy_score || 0,
      feedback: raw.feedback_visibility_score || 0,
      error_prevention: raw.error_prevention_score || 0,
      efficiency: raw.interaction_efficiency_score || 0,
    },
  };
}

function SubScoreRow({ label, values }: { label: string; values: number[] }) {
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const spread = Math.max(...values) - Math.min(...values);

  return (
    <div className="flex items-center py-2.5 border-b border-border/20 last:border-0">
      <span className="text-sm font-medium flex-1 min-w-0">{label}</span>
      {values.map((v, i) => (
        <span key={i} className="w-16 text-center text-sm tabular-nums font-semibold">
          {v}
        </span>
      ))}
      <span className="w-16 text-center text-sm tabular-nums font-bold text-primary">{avg}</span>
      <span
        className={cn(
          "w-16 text-center text-xs tabular-nums font-medium",
          spread <= 5 && "text-[hsl(var(--severity-low))]",
          spread > 5 && spread <= 15 && "text-[hsl(var(--severity-medium))]",
          spread > 15 && "text-[hsl(var(--severity-high))]"
        )}
      >
        ±{spread}
      </span>
    </div>
  );
}

function IssuePresenceRow({
  issue,
  runCount,
  presence,
}: {
  issue: HeuristicResult;
  runCount: number;
  presence: boolean[];
}) {
  const foundIn = presence.filter(Boolean).length;
  const isConsensus = foundIn >= Math.ceil(runCount / 2);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        isConsensus
          ? "bg-card border-border/50"
          : "bg-muted/20 border-border/20 opacity-60"
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <SeverityBadge severity={issue.severity} />
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {issue.heuristic_name}
          </Badge>
          {isConsensus && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
              Consensus
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium line-clamp-2">{issue.issue}</p>
        {issue.recommendation && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {issue.recommendation}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {presence.map((found, i) => (
          <div
            key={i}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold",
              found
                ? "bg-[hsl(var(--severity-low))]/10 text-[hsl(var(--severity-low))]"
                : "bg-muted/40 text-muted-foreground/40"
            )}
            title={`Run ${i + 1}: ${found ? "Found" : "Not found"}`}
          >
            {found ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground shrink-0 w-12 text-center self-center tabular-nums font-semibold">
        {foundIn}/{runCount}
      </div>
    </div>
  );
}

export default function RunComparison() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getAnalysis(id), getAnalysisRuns(id)]).then(
      ([data, runsData]) => {
        setAnalysis(data);
        setRuns(runsData);
        setLoading(false);
      }
    );
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container max-w-5xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!analysis || runs.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container max-w-5xl mx-auto px-6 py-12">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No multi-run data available</h3>
              <p className="text-sm text-muted-foreground">
                This analysis was run in Fast Mode (single run). Use Reliable Mode (3 runs) to see side-by-side run comparisons.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const parsed = runs.map(parseRun);
  const allIssues = new Map<string, { issue: HeuristicResult; presence: boolean[] }>();

  parsed.forEach((run, runIdx) => {
    run.heuristic_results.forEach((hr) => {
      const key = `${hr.heuristic_name}::${hr.issue}`;
      if (!allIssues.has(key)) {
        allIssues.set(key, {
          issue: hr,
          presence: new Array(parsed.length).fill(false),
        });
      }
      allIssues.get(key)!.presence[runIdx] = true;
    });
  });

  const issueList = Array.from(allIssues.values()).sort((a, b) => {
    const aCount = a.presence.filter(Boolean).length;
    const bCount = b.presence.filter(Boolean).length;
    if (bCount !== aCount) return bCount - aCount;
    const sevOrder = { High: 0, Medium: 1, Low: 2 };
    return (sevOrder[a.issue.severity] || 2) - (sevOrder[b.issue.severity] || 2);
  });

  const consensusCount = issueList.filter(
    (i) => i.presence.filter(Boolean).length >= Math.ceil(parsed.length / 2)
  ).length;
  const uniqueOnlyCount = issueList.length - consensusCount;

  const scoreSpread =
    Math.max(...parsed.map((p) => p.overall_score)) -
    Math.min(...parsed.map((p) => p.overall_score));

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container max-w-5xl mx-auto px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Report
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Run-by-Run Comparison
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {analysis.page_title || analysis.url} — {parsed.length} parallel runs
          </p>
        </div>

        {/* Score overview per run */}
        <div className={cn("grid gap-4 mb-8", `grid-cols-${Math.min(parsed.length + 1, 5)}`)}>
          <style>{`.run-grid { display: grid; grid-template-columns: repeat(${parsed.length + 1}, minmax(0, 1fr)); gap: 1rem; }`}</style>
          <div className="run-grid">
            {parsed.map((run) => (
              <Card key={run.run_index} className="border-border/50">
                <CardContent className="p-5 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                    Run {run.run_index + 1}
                  </p>
                  <ScoreRing score={run.overall_score} size={72} strokeWidth={5} />
                  <p className="text-xs text-muted-foreground mt-2">
                    {run.heuristic_results.length} issues
                  </p>
                </CardContent>
              </Card>
            ))}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5 text-center">
                <p className="text-[10px] uppercase tracking-widest text-primary mb-3 font-semibold">
                  Consensus
                </p>
                <ScoreRing score={analysis.overall_score || 0} size={72} strokeWidth={5} />
                <p className="text-xs text-muted-foreground mt-2">
                  {analysis.heuristic_results.length} issues
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Consistency stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Score Spread</p>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  scoreSpread <= 5 && "text-[hsl(var(--severity-low))]",
                  scoreSpread > 5 && scoreSpread <= 15 && "text-[hsl(var(--severity-medium))]",
                  scoreSpread > 15 && "text-[hsl(var(--severity-high))]"
                )}
              >
                ±{scoreSpread}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Consensus Issues</p>
              <p className="text-2xl font-bold tabular-nums text-primary">{consensusCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Unique-only (filtered)</p>
              <p className="text-2xl font-bold tabular-nums text-muted-foreground">{uniqueOnlyCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sub-score comparison table */}
        <Card className="border-border/50 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Sub-Score Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Header */}
            <div className="flex items-center py-2 border-b border-border/40 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <span className="flex-1">Metric</span>
              {parsed.map((_, i) => (
                <span key={i} className="w-16 text-center">Run {i + 1}</span>
              ))}
              <span className="w-16 text-center text-primary">Avg</span>
              <span className="w-16 text-center">Spread</span>
            </div>
            <SubScoreRow label="Navigation Clarity" values={parsed.map((p) => p.sub_scores.navigation)} />
            <SubScoreRow label="Information Hierarchy" values={parsed.map((p) => p.sub_scores.hierarchy)} />
            <SubScoreRow label="Feedback Visibility" values={parsed.map((p) => p.sub_scores.feedback)} />
            <SubScoreRow label="Error Prevention" values={parsed.map((p) => p.sub_scores.error_prevention)} />
            <SubScoreRow label="Interaction Efficiency" values={parsed.map((p) => p.sub_scores.efficiency)} />
          </CardContent>
        </Card>

        {/* Issue presence matrix */}
        <Card className="border-border/50 mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Issue Detection Matrix</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--severity-low))]" /> Detected
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/40" /> Not found
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {issueList.map((item, i) => (
              <IssuePresenceRow
                key={i}
                issue={item.issue}
                runCount={parsed.length}
                presence={item.presence}
              />
            ))}
            {issueList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No issues found across runs.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
