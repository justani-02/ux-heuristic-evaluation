import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScoreRing } from "@/components/ScoreRing";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Activity, BarChart3, Repeat } from "lucide-react";
import type { AnalysisResult, AnalysisRun } from "@/lib/api/analysis";

function confidenceLabel(score: number): { label: string; color: string; icon: typeof ShieldCheck } {
  if (score >= 80) return { label: "High", color: "text-[hsl(var(--severity-low))]", icon: ShieldCheck };
  if (score >= 50) return { label: "Medium", color: "text-[hsl(var(--severity-medium))]", icon: ShieldAlert };
  return { label: "Low", color: "text-muted-foreground", icon: ShieldQuestion };
}

interface TrustConfidenceSectionProps {
  analysis: AnalysisResult;
  runs: AnalysisRun[];
}

export function TrustConfidenceSection({ analysis, runs }: TrustConfidenceSectionProps) {
  const score = analysis.confidence_score ?? 0;
  const runCount = analysis.run_count ?? 1;
  const mode = analysis.analysis_mode === "reliable" ? "Reliable" : "Fast";
  const { label, color, icon: Icon } = confidenceLabel(score);

  const scores = runs.map(r => r.overall_score ?? 0);
  const scoreRange = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : 0;
  const stability = scoreRange <= 5 ? "Very stable" : scoreRange <= 15 ? "Moderately stable" : "Variable";

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <ShieldCheck className="w-5 h-5 text-primary" />
          Trust & Confidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Confidence Score */}
          <div className="flex items-center gap-4">
            <ScoreRing score={score} size={64} strokeWidth={5} label="Trust" />
            <div>
              <div className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className={`font-semibold text-sm ${color}`}>{label} Confidence</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {runCount > 1
                  ? `${score}% consistency across ${runCount} runs`
                  : "Single run — use Reliable Mode for higher confidence"}
              </p>
            </div>
          </div>

          {/* Run Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{runCount} Run{runCount !== 1 ? "s" : ""}</p>
              <p className="text-xs text-muted-foreground">
                Mode: <Badge variant="outline" className="text-[10px] ml-1 py-0">{mode}</Badge>
              </p>
            </div>
          </div>

          {/* Stability */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{stability}</p>
              <p className="text-xs text-muted-foreground">
                {runCount > 1
                  ? `Score range: ${Math.min(...scores)}–${Math.max(...scores)}`
                  : "Run in Reliable Mode for stability data"}
              </p>
            </div>
          </div>
        </div>

        {/* Individual run scores */}
        {runs.length > 1 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Individual Run Scores</p>
            <div className="flex gap-3">
              {runs.map((run) => (
                <Tooltip key={run.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/40 cursor-default">
                      <BarChart3 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium">Run {run.run_index}: {run.overall_score ?? "–"}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Score from analysis run #{run.run_index}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
