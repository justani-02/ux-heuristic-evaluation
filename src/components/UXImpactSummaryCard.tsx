import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { type HeuristicResult } from "@/lib/api/analysis";
import { AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";

function getTopIssues(results: HeuristicResult[], count = 3): HeuristicResult[] {
  const scored = results.map((r) => {
    let score = 0;
    if (r.severity === "High") score += 3;
    else if (r.severity === "Medium") score += 1;
    if (r.impact === "High") score += 3;
    else if (r.impact === "Medium") score += 1;
    const kpi = (r.kpi_impact || "").toLowerCase();
    if (kpi.includes("conversion") || kpi.includes("completion") || kpi.includes("retention")) score += 2;
    return { result: r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.result);
}

export function UXImpactSummaryCard({ results }: { results: HeuristicResult[] }) {
  const top = getTopIssues(results);
  if (!top.length) return null;

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <AlertTriangle className="w-5 h-5 text-[hsl(var(--severity-high))]" />
          Top UX Issues Impacting Key Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {top.map((issue, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/30">
            <span className="mt-0.5 text-muted-foreground font-bold text-sm shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{issue.issue}</span>
                <SeverityBadge severity={issue.impact || issue.severity} />
              </div>
              {issue.kpi_impact && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                  Affects: <span className="font-medium text-foreground">{issue.kpi_impact}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Lightbulb className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <span>Fix: {issue.recommendation}</span>
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
