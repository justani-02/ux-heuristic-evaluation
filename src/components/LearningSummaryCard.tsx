import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Target, BarChart3, AlertCircle } from "lucide-react";
import { getLearningInsights, type LearningInsights } from "@/lib/api/learning";
import { Skeleton } from "@/components/ui/skeleton";

export function LearningSummaryCard() {
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLearningInsights().then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Card className="border-border/50 mb-8">
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-20" /></CardContent>
      </Card>
    );
  }

  if (!insights || insights.total_analyses < 2) {
    return null;
  }

  const items = [
    {
      icon: Target,
      label: "Most Impactful Heuristic",
      value: insights.most_impactful_heuristic || "–",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: BarChart3,
      label: "Most Improved KPI",
      value: insights.most_improved_kpi || "–",
      color: "text-[hsl(var(--severity-low))]",
      bg: "bg-[hsl(var(--severity-low)/0.1)]",
    },
    {
      icon: AlertCircle,
      label: "Most Common Issue",
      value: insights.most_common_issue || "–",
      color: "text-[hsl(var(--severity-medium))]",
      bg: "bg-[hsl(var(--severity-medium)/0.1)]",
    },
  ];

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[hsl(var(--severity-medium))]" />
          Learning Insights
        </CardTitle>
        <CardDescription>
          Patterns from {insights.total_analyses} analyses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
