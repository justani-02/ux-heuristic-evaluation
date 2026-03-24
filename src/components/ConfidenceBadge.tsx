import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/api/learning";
import { cn } from "@/lib/utils";

const config: Record<ConfidenceLevel, { icon: typeof ShieldCheck; className: string; label: string }> = {
  High: {
    icon: ShieldCheck,
    className: "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low)/0.3)] bg-[hsl(var(--severity-low)/0.08)]",
    label: "High",
  },
  Medium: {
    icon: ShieldAlert,
    className: "text-[hsl(var(--severity-medium))] border-[hsl(var(--severity-medium)/0.3)] bg-[hsl(var(--severity-medium)/0.08)]",
    label: "Medium",
  },
  Low: {
    icon: ShieldQuestion,
    className: "text-muted-foreground border-border bg-muted/50",
    label: "Low",
  },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  count: number;
  compact?: boolean;
}

export function ConfidenceBadge({ level, count, compact }: ConfidenceBadgeProps) {
  const { icon: Icon, className, label } = config[level];

  return (
    <Badge variant="outline" className={cn("text-xs gap-1 font-medium", className)}>
      <Icon className="w-3 h-3" />
      {compact ? label : `${label} (${count})`}
    </Badge>
  );
}
