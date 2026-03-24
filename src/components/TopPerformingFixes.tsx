import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, ArrowUpRight } from "lucide-react";
import { getTopPerformingFixes, type TopFix } from "@/lib/api/learning";
import { Skeleton } from "@/components/ui/skeleton";

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
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </CardContent>
      </Card>
    );
  }

  if (fixes.length === 0) {
    return (
      <Card className="border-border/50 mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[hsl(var(--severity-medium))]" />
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
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[hsl(var(--severity-medium))]" />
          Top Performing UX Fixes
        </CardTitle>
        <CardDescription>
          Ranked by validated impact on UX scores and KPIs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {fixes.map((fix, i) => (
            <div
              key={fix.heuristic_name}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/30"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fix.heuristic_name}</p>
                <p className="text-xs text-muted-foreground">
                  {fix.count} validated fix{fix.count !== 1 ? "es" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-xs gap-1 text-[hsl(var(--severity-low))] border-[hsl(var(--severity-low)/0.3)]">
                  <TrendingUp className="w-3 h-3" />
                  +{fix.avg_score_improvement} score
                </Badge>
                {fix.avg_kpi_improvement !== 0 && (
                  <Badge variant="outline" className="text-xs gap-1 text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.3)]">
                    <ArrowUpRight className="w-3 h-3" />
                    {fix.avg_kpi_improvement > 0 ? "+" : ""}{fix.avg_kpi_improvement}% {fix.kpi_label}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
