import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/api/learning";
import { cn } from "@/lib/utils";

const config: Record<ConfidenceLevel, {
  icon: typeof ShieldCheck;
  className: string;
  label: string;
  tooltip: string;
}> = {
  High: {
    icon: ShieldCheck,
    className: "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low)/0.3)] bg-[hsl(var(--severity-low)/0.08)]",
    label: "High",
    tooltip: "High confidence — 5+ similar fixes validated as improved",
  },
  Medium: {
    icon: ShieldAlert,
    className: "text-[hsl(var(--severity-medium))] border-[hsl(var(--severity-medium)/0.3)] bg-[hsl(var(--severity-medium)/0.08)]",
    label: "Medium",
    tooltip: "Medium confidence — 2–4 similar fixes validated",
  },
  Low: {
    icon: ShieldQuestion,
    className: "text-muted-foreground border-border/60 bg-muted/40",
    label: "Low",
    tooltip: "Low confidence — limited validation data available",
  },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  count: number;
  compact?: boolean;
}

export function ConfidenceBadge({ level, count, compact }: ConfidenceBadgeProps) {
  const { icon: Icon, className, label, tooltip } = config[level];

  const badge = (
    <Badge variant="outline" className={cn("text-xs gap-1 font-semibold whitespace-nowrap cursor-default", className)}>
      <Icon className="w-3 h-3 shrink-0" />
      {compact ? label : `${label} (${count})`}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[220px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}