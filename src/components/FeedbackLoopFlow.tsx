import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type AnalysisResult, computeValidationStatus } from "@/lib/api/analysis";
import {
  Search,
  Target,
  Wrench,
  BarChart3,
  GraduationCap,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "analyze", label: "Analyze", icon: Search, desc: "Identify issues" },
  { key: "prioritize", label: "Prioritize", icon: Target, desc: "Rank by impact" },
  { key: "act", label: "Act", icon: Wrench, desc: "Implement fixes" },
  { key: "measure", label: "Measure", icon: BarChart3, desc: "Track changes" },
  { key: "learn", label: "Learn", icon: GraduationCap, desc: "Validate" },
];

export function FeedbackLoopFlow({
  baseline,
  updated,
  resolvedCount,
}: {
  baseline: AnalysisResult;
  updated: AnalysisResult;
  resolvedCount: number;
}) {
  const scoreDelta = (updated.overall_score || 0) - (baseline.overall_score || 0);
  const validation = computeValidationStatus(baseline, updated);

  const details: Record<string, { value: string; color?: string }> = {
    analyze: { value: `${baseline.heuristic_results.length} issues` },
    prioritize: { value: `${baseline.heuristic_results.filter((r) => r.impact === "High").length} high-impact` },
    act: {
      value: `${resolvedCount} fixed`,
      color: resolvedCount > 0 ? "text-[hsl(var(--severity-low))]" : undefined,
    },
    measure: {
      value: `${scoreDelta > 0 ? "+" : ""}${scoreDelta} pts`,
      color: scoreDelta > 0 ? "text-[hsl(var(--severity-low))]" : scoreDelta < 0 ? "text-[hsl(var(--severity-high))]" : undefined,
    },
    learn: {
      value: validation,
      color: validation === "Improved"
        ? "text-[hsl(var(--severity-low))]"
        : validation === "Partially Improved"
        ? "text-[hsl(var(--severity-medium))]"
        : "text-[hsl(var(--severity-high))]",
    },
  };

  // Steps are always "completed" in this static flow
  const completedSteps = resolvedCount > 0 ? 5 : 2;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-primary" />
          UX Feedback Loop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between overflow-x-auto gap-0">
          {STEPS.map((step, i) => {
            const done = i < completedSteps;
            const detail = details[step.key];
            return (
              <div key={step.key} className="flex items-start">
                <div className="flex flex-col items-center text-center min-w-[100px] relative">
                  {/* Circle with icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center mb-2 border-2 transition-all relative",
                    done
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/60 border-border"
                  )}>
                    <step.icon className={cn("w-5 h-5", done ? "text-primary" : "text-muted-foreground")} />
                    {done && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(var(--severity-low))] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className={cn("text-xs font-semibold mb-0.5", done ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{step.desc}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] mt-1.5 px-2 py-0 h-5 font-medium",
                      detail.color || "text-muted-foreground"
                    )}
                  >
                    {detail.value}
                  </Badge>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex items-center pt-5 px-0.5">
                    <div className={cn(
                      "h-0.5 w-4",
                      done ? "bg-primary/30" : "bg-border"
                    )} />
                    <ChevronRight className={cn("w-3.5 h-3.5 shrink-0", done ? "text-primary/50" : "text-muted-foreground/30")} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
