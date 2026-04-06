import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueConfidenceBadgeProps {
  occurrenceCount: number;
  totalRuns: number;
  compact?: boolean;
}

export function IssueConfidenceBadge({ occurrenceCount, totalRuns, compact }: IssueConfidenceBadgeProps) {
  if (totalRuns <= 1) return null;

  const ratio = occurrenceCount / totalRuns;
  const level = ratio >= 0.8 ? "High" : ratio >= 0.5 ? "Medium" : "Low";

  const config = {
    High: {
      icon: ShieldCheck,
      className: "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low)/0.3)] bg-[hsl(var(--severity-low)/0.08)]",
      tooltip: `Detected in ${occurrenceCount}/${totalRuns} runs — high reliability`,
    },
    Medium: {
      icon: ShieldAlert,
      className: "text-[hsl(var(--severity-medium))] border-[hsl(var(--severity-medium)/0.3)] bg-[hsl(var(--severity-medium)/0.08)]",
      tooltip: `Detected in ${occurrenceCount}/${totalRuns} runs — moderate reliability`,
    },
    Low: {
      icon: ShieldQuestion,
      className: "text-muted-foreground border-border/60 bg-muted/40",
      tooltip: `Detected in ${occurrenceCount}/${totalRuns} runs — limited reliability`,
    },
  };

  const { icon: Icon, className, tooltip } = config[level];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={cn("text-xs gap-1 font-semibold whitespace-nowrap cursor-default", className)}>
          <Icon className="w-3 h-3 shrink-0" />
          {compact ? `${occurrenceCount}/${totalRuns}` : `${occurrenceCount}/${totalRuns} runs`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[220px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
