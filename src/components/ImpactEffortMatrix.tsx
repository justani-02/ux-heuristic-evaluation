import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { HeuristicResult } from "@/lib/api/analysis";
import { cn } from "@/lib/utils";

type Quadrant = "quick-wins" | "strategic" | "fill-ins" | "avoid";

const quadrantConfig: Record<Quadrant, { label: string; description: string; bg: string; border: string }> = {
  "quick-wins": {
    label: "🚀 Quick Wins",
    description: "High Impact, Low Effort",
    bg: "bg-[hsl(var(--severity-low))]/5",
    border: "border-[hsl(var(--severity-low))]/20",
  },
  strategic: {
    label: "🎯 Strategic",
    description: "High Impact, High Effort",
    bg: "bg-[hsl(var(--severity-medium))]/5",
    border: "border-[hsl(var(--severity-medium))]/20",
  },
  "fill-ins": {
    label: "📋 Fill-ins",
    description: "Low Impact, Low Effort",
    bg: "bg-primary/5",
    border: "border-primary/20",
  },
  avoid: {
    label: "⛔ Avoid",
    description: "Low Impact, High Effort",
    bg: "bg-[hsl(var(--severity-high))]/5",
    border: "border-[hsl(var(--severity-high))]/20",
  },
};

function getQuadrant(impact: string, effort: string): Quadrant {
  const highImpact = impact === "High" || impact === "Medium";
  const lowEffort = effort === "Low" || effort === "Medium";
  if (highImpact && lowEffort) return "quick-wins";
  if (highImpact && !lowEffort) return "strategic";
  if (!highImpact && lowEffort) return "fill-ins";
  return "avoid";
}

export function ImpactEffortMatrix({ results }: { results: HeuristicResult[] }) {
  const quadrants: Record<Quadrant, HeuristicResult[]> = {
    "quick-wins": [],
    strategic: [],
    "fill-ins": [],
    avoid: [],
  };

  results.forEach((r) => {
    const q = getQuadrant(r.impact || "Medium", r.effort || "Medium");
    quadrants[q].push(r);
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Impact vs Effort Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {(["quick-wins", "strategic", "fill-ins", "avoid"] as Quadrant[]).map((q) => {
            const config = quadrantConfig[q];
            return (
              <div key={q} className={cn("rounded-lg border p-3 min-h-[140px]", config.bg, config.border)}>
                <div className="mb-2">
                  <p className="text-sm font-semibold">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <div className="space-y-1.5">
                  {quadrants[q].map((r, i) => (
                    <div key={i} className="bg-background/80 rounded-md p-2 text-xs border border-border/50">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-medium truncate">{r.task_title || r.issue.substring(0, 40)}</span>
                        <SeverityBadge severity={r.severity} />
                      </div>
                      {r.kpi_impact && (
                        <span className="text-muted-foreground">{r.kpi_impact}</span>
                      )}
                    </div>
                  ))}
                  {quadrants[q].length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No issues</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>← Low Effort</span>
          <span>High Effort →</span>
        </div>
      </CardContent>
    </Card>
  );
}
