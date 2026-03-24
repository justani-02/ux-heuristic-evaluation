import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AnalysisResult, computeValidationStatus } from "@/lib/api/analysis";
import { Search, Target, Wrench, BarChart3, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "analyze", label: "Analyze", icon: Search, desc: "Identify UX issues" },
  { key: "prioritize", label: "Prioritize", icon: Target, desc: "Rank by impact & effort" },
  { key: "act", label: "Act", icon: Wrench, desc: "Implement fixes" },
  { key: "measure", label: "Measure", icon: BarChart3, desc: "Track KPI changes" },
  { key: "learn", label: "Learn", icon: GraduationCap, desc: "Validate outcomes" },
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

  const details: Record<string, string> = {
    analyze: `${baseline.heuristic_results.length} issues found`,
    prioritize: `${baseline.heuristic_results.filter((r) => r.impact === "High").length} high-impact`,
    act: `${resolvedCount} issues fixed`,
    measure: `Score: ${scoreDelta > 0 ? "+" : ""}${scoreDelta}`,
    learn: validation,
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Feedback Loop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between overflow-x-auto gap-1">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center gap-1">
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                <p className="text-[10px] font-medium text-primary mt-1">{details[step.key]}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
