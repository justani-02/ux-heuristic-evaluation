import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type AnalysisResult, computeValidationStatus, getResolvedIssues } from "@/lib/api/analysis";
import { TrendingUp, CheckCircle2, BarChart3, Shield } from "lucide-react";
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
  const validation = computeValidationStatus(baseline, updated);

  const kpis = [
    kpiDelta("Conversion", baseline.conversion_rate, updated.conversion_rate),
    kpiDelta("Bounce Rate", baseline.bounce_rate, updated.bounce_rate, true),
    kpiDelta("Task Completion", baseline.task_completion_rate, updated.task_completion_rate),
    kpiDelta("Drop-off", baseline.drop_off_rate, updated.drop_off_rate, true),
  ].filter(Boolean) as { label: string; delta: number; good: boolean; raw: number }[];

  const statusColor = validation === "Improved"
    ? "bg-[hsl(var(--severity-low))]/10 text-[hsl(var(--severity-low))]"
    : validation === "Partially Improved"
    ? "bg-[hsl(var(--severity-medium))]/10 text-[hsl(var(--severity-medium))]"
    : "bg-[hsl(var(--severity-high))]/10 text-[hsl(var(--severity-high))]";

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
          <div className="p-3 rounded-lg bg-muted/40 border border-border/30 text-center">
            <TrendingUp className={cn("w-5 h-5 mx-auto mb-1", scoreDelta >= 0 ? "text-[hsl(var(--severity-low))]" : "text-[hsl(var(--severity-high))]")} />
            <p className={cn("text-2xl font-bold", scoreDelta > 0 ? "text-[hsl(var(--severity-low))]" : scoreDelta < 0 ? "text-[hsl(var(--severity-high))]" : "")}>
              {scoreDelta > 0 ? "+" : ""}{scoreDelta}
            </p>
            <p className="text-xs text-muted-foreground">UX Score Change</p>
          </div>

          {/* Issues Resolved */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/30 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-[hsl(var(--severity-low))]" />
            <p className="text-2xl font-bold">{resolved.length}</p>
            <p className="text-xs text-muted-foreground">Issues Resolved</p>
          </div>

          {/* KPI Improvements */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
            <BarChart3 className="w-5 h-5 mx-auto mb-1 text-primary" />
            {kpis.length > 0 ? (
              <div className="space-y-1">
                {kpis.map((k) => (
                  <p key={k.label} className={cn("text-xs font-medium", k.good ? "text-[hsl(var(--severity-low))]" : "text-[hsl(var(--severity-high))]")}>
                    {k.label}: {k.raw > 0 ? "+" : ""}{k.raw.toFixed(1)}%
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">No KPI data</p>
            )}
          </div>

          {/* Validation Status */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border/30 text-center">
            <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
            <Badge className={cn("text-xs", statusColor)}>{validation}</Badge>
            <p className="text-xs text-muted-foreground mt-1">Validation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
