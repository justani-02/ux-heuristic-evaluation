import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, ArrowUpRight, Award, Zap } from "lucide-react";
import { getTopPerformingFixes, type TopFix } from "@/lib/api/learning";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const rankStyles = [
  "bg-[hsl(var(--severity-medium)/0.15)] text-[hsl(var(--severity-medium))] border-[hsl(var(--severity-medium)/0.3)] ring-2 ring-[hsl(var(--severity-medium)/0.1)]",
  "bg-muted/60 text-muted-foreground border-border/50",
  "bg-muted/40 text-muted-foreground border-border/30",
];

const rankIcons = [Award, Zap, Zap];

export function TopPerformingFixes() {
  const [fixes, setFixes] = useState<TopFix[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopPerformingFixes().then((data) => {
      setFixes(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50 mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (fixes.length === 0) {
    return (
      <Card className="border-border/50 mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[hsl(var(--severity-medium)/0.12)]">
              <Trophy className="w-4 h-4 text-[hsl(var(--severity-medium))]" />
            </div>
            Top Performing UX Fixes
          </CardTitle>
          <CardDescription>
            Run multiple analyses with KPI data to see which fixes drive the best results.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[hsl(var(--severity-medium)/0.12)]">
            <Trophy className="w-4 h-4 text-[hsl(var(--severity-medium))]" />
          </div>
          Top Performing UX Fixes
        </CardTitle>
        <CardDescription>
          Ranked by validated impact on UX scores and KPIs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {fixes.map((fix, i) => {
            const isTop = i === 0;
            const RankIcon = rankIcons[Math.min(i, rankIcons.length - 1)];
            return (
              <div
                key={fix.heuristic_name}
                className={cn(
                  "flex items-center gap-3 rounded-xl border transition-all",
                  isTop ? "p-4" : "p-3",
                  rankStyles[Math.min(i, rankStyles.length - 1)]
                )}
              >
                <div className={cn(
                  "flex items-center justify-center rounded-full font-bold shrink-0",
                  isTop
                    ? "w-9 h-9 text-sm bg-[hsl(var(--severity-medium)/0.2)] text-[hsl(var(--severity-medium))]"
                    : "w-7 h-7 text-xs bg-muted text-muted-foreground"
                )}>
                  {isTop ? <RankIcon className="w-4 h-4" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold truncate", isTop ? "text-sm" : "text-sm")}>
                    {fix.heuristic_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fix.count} validated fix{fix.count !== 1 ? "es" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs gap-1 font-semibold",
                      "text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low)/0.3)] bg-[hsl(var(--severity-low)/0.08)]"
                    )}
                  >
                    <TrendingUp className="w-3 h-3" />
                    +{fix.avg_score_improvement} pts
                  </Badge>
                  {fix.avg_kpi_improvement !== 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs gap-1 font-semibold text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.3)] bg-[hsl(var(--accent)/0.08)]"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      {fix.avg_kpi_improvement > 0 ? "+" : ""}{fix.avg_kpi_improvement}%
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}