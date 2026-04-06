import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HeuristicResult } from "@/lib/api/analysis";

interface ExplainabilityPanelProps {
  result: HeuristicResult;
  totalRuns?: number;
}

export function ExplainabilityPanel({ result, totalRuns }: ExplainabilityPanelProps) {
  const [open, setOpen] = useState(false);

  const hasContent = result.why_flagged || result.evidence;
  if (!hasContent && !result.occurrence_count) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Eye className="w-3 h-3" />
        <span className="font-medium">
          {open ? "Hide" : "Show"} reasoning
        </span>
        {result.occurrence_count && totalRuns && totalRuns > 1 && (
          <Badge variant="outline" className="text-[10px] ml-1 py-0 px-1.5 font-normal">
            {result.occurrence_count}/{totalRuns} runs
          </Badge>
        )}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-primary/20 animate-fade-in">
          {result.why_flagged && (
            <div className="flex gap-2 items-start">
              <MessageSquare className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Why Flagged</p>
                <p className="text-xs text-foreground/80">{result.why_flagged}</p>
              </div>
            </div>
          )}
          {result.evidence && (
            <div className="flex gap-2 items-start">
              <Eye className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Evidence</p>
                <p className="text-xs text-foreground/80 italic">"{result.evidence}"</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
