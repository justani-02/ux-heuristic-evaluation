import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityStyles = {
  High: "bg-[hsl(var(--severity-high))]/15 text-[hsl(var(--severity-high))] border-[hsl(var(--severity-high))]/30",
  Medium: "bg-[hsl(var(--severity-medium))]/15 text-[hsl(var(--severity-medium))] border-[hsl(var(--severity-medium))]/30",
  Low: "bg-[hsl(var(--severity-low))]/15 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low))]/30",
};

export function SeverityBadge({ severity }: { severity: "High" | "Medium" | "Low" }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", severityStyles[severity])}>
      {severity}
    </Badge>
  );
}
