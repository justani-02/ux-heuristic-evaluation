import { Check, Globe, Brain, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnalysisStage = "scraping" | "analyzing" | "generating";

const STAGES: { key: AnalysisStage; label: string; icon: typeof Globe; desc: string }[] = [
  { key: "scraping", label: "Scraping", icon: Globe, desc: "Fetching page content & screenshots…" },
  { key: "analyzing", label: "Analyzing", icon: Brain, desc: "Evaluating against 10 heuristics…" },
  { key: "generating", label: "Generating Report", icon: FileText, desc: "Building insights & tasks…" },
];

function stageIndex(stage: AnalysisStage) {
  return STAGES.findIndex((s) => s.key === stage);
}

export function AnalysisProgress({ stage }: { stage: AnalysisStage }) {
  const active = stageIndex(stage);

  return (
    <div className="max-w-md mx-auto py-12 animate-fade-in">
      <div className="space-y-1 text-center mb-10">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Analyzing your site
        </h2>
        <p className="text-sm text-muted-foreground">This usually takes 15–30 seconds</p>
      </div>

      <div className="space-y-0">
        {STAGES.map((s, i) => {
          const isDone = i < active;
          const isCurrent = i === active;

          return (
            <div key={s.key} className="flex items-start gap-4">
              {/* Vertical line + icon */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0",
                    isDone && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isDone && !isCurrent && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 animate-scale-in" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                </div>
                {i < STAGES.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-8 transition-colors duration-500",
                      isDone ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Text */}
              <div className={cn("pt-2 pb-4 transition-opacity duration-300", !isDone && !isCurrent && "opacity-40")}>
                <p className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.label}
                </p>
                <p className="text-xs text-muted-foreground">{isCurrent ? s.desc : isDone ? "Complete" : s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
