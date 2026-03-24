import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type AnalysisResult, computeValidationStatus, getResolvedIssues, getNewIssues } from "@/lib/api/analysis";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

function kpiDelta(label: string, before: number | null, after: number | null, invert = false) {
  if (before == null || after == null) return null;
  const delta = after - before;
  const good = invert ? delta < 0 : delta > 0;
  return { label, delta: invert ? -delta : delta, good, raw: delta };
}

export function UXImprovementSummaryCard({
  baseline,
  updated,
}: {
  baseline: AnalysisResult;
  updated: AnalysisResult;
}) {
  const scoreDelta = (updated.overall_score || 0) - (baseline.overall_score || 0);
  const resolved = getResolvedIssues(baseline, updated);
  const newIssues = getNewIssues(baseline, updated);
  const validation = computeValidationStatus(baseline, updated);

  const kpis = [
    kpiDelta("Conversion", baseline.conversion_rate, updated.conversion_rate),
    kpiDelta("Bounce", baseline.bounce_rate, updated.bounce_rate, true),
    kpiDelta("Completion", baseline.task_completion_rate, updated.task_completion_rate),
    kpiDelta("Drop-off", baseline.drop_off_rate, updated.drop_off_rate, true),
  ].filter(Boolean) as { label: string; delta: number; good: boolean; raw: number }[];

  const validationConfig = {
    Improved: { icon: ShieldCheck, color: "text-[hsl(var(--severity-low))]", bg: "bg-[hsl(var(--severity-low))]/10", border: "border-[hsl(var(--severity-low))]/20" },
    "Partially Improved": { icon: ShieldQuestion, color: "text-[hsl(var(--severity-medium))]", bg: "bg-[hsl(var(--severity-medium))]/10", border: "border-[hsl(var(--severity-medium))]/20" },
    "No Impact": { icon: ShieldAlert, color: "text-[hsl(var(--severity-high))]", bg: "bg-[hsl(var(--severity-high))]/10", border: "border-[hsl(var(--severity-high))]/20" },
  }[validation];
  const ValidationIcon = validationConfig.icon;

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          UX Improvement Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Score Change */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/30 text-center space-y-1">
            <div className={cn(
              "w-10 h-10 rounded-full mx-auto flex items-center justify-center",
              scoreDelta > 0 ? "bg-[hsl(var(--severity-low))]/10" : scoreDelta < 0 ? "bg-[hsl(var(--severity-high))]/10" : "bg-muted"
            )}>
              {scoreDelta > 0 ? <TrendingUp className="w-5 h-5 text-[hsl(var(--severity-low))]" /> :
               scoreDelta < 0 ? <TrendingDown className="w-5 h-5 text-[hsl(var(--severity-high))]" /> :
               <Minus className="w-5 h-5 text-muted-foreground" />}
            </div>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              scoreDelta > 0 ? "text-[hsl(var(--severity-low))]" : scoreDelta < 0 ? "text-[hsl(var(--severity-high))]" : ""
            )}>
              {scoreDelta > 0 ? "+" : ""}{scoreDelta}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Score Δ</p>
          </div>

          {/* Issues Resolved vs New */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/30 text-center space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div>
                <div className="flex items-center gap-1 text-[hsl(var(--severity-low))]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xl font-bold">{resolved.length}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Fixed</p>
              </div>
              <Minus className="w-3 h-3 text-muted-foreground/40 rotate-90" />
              <div>
                <div className="flex items-center gap-1 text-[hsl(var(--severity-high))]">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xl font-bold">{newIssues.length}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">New</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Issues</p>
          </div>

          {/* KPI Improvements */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/30 space-y-1.5">
            <BarChart3 className="w-5 h-5 text-primary mx-auto" />
            {kpis.length > 0 ? (
              <div className="space-y-1">
                {kpis.map((k) => (
                  <div key={k.label} className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-muted-foreground">{k.label}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-4 font-bold tabular-nums gap-0.5",
                        k.good ? "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/40 bg-[hsl(var(--severity-low))]/5" :
                                 "text-[hsl(var(--severity-high))] border-[hsl(var(--severity-high))]/40 bg-[hsl(var(--severity-high))]/5"
                      )}
                    >
                      {k.good ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {k.raw > 0 ? "+" : ""}{k.raw.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground text-center pt-1">Input KPIs below</p>
            )}
          </div>

          {/* Validation Status */}
          <div className={cn("p-4 rounded-xl border text-center space-y-1.5", validationConfig.bg, validationConfig.border)}>
            <div className={cn("w-10 h-10 rounded-full mx-auto flex items-center justify-center bg-background/60")}>
              <ValidationIcon className={cn("w-5 h-5", validationConfig.color)} />
            </div>
            <Badge className={cn("text-xs px-2.5 py-0.5 font-semibold", validationConfig.bg, validationConfig.color, "border-0")}>
              {validation}
            </Badge>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
