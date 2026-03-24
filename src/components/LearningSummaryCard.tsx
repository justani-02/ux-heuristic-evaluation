import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, BarChart3, AlertCircle, Sparkles } from "lucide-react";
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </CardContent>
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
      sublabel: "Highest avg KPI improvement when fixed",
      value: insights.most_impactful_heuristic || "–",
      color: "text-primary",
      bg: "bg-primary/10",
      ring: "ring-primary/20",
    },
    {
      icon: BarChart3,
      label: "Most Improved KPI",
      sublabel: "Strongest positive trend across analyses",
      value: insights.most_improved_kpi || "–",
      color: "text-[hsl(var(--severity-low))]",
      bg: "bg-[hsl(var(--severity-low)/0.1)]",
      ring: "ring-[hsl(var(--severity-low)/0.2)]",
    },
    {
      icon: AlertCircle,
      label: "Most Common Issue",
      sublabel: "Appears most frequently in evaluations",
      value: insights.most_common_issue || "–",
      color: "text-[hsl(var(--severity-medium))]",
      bg: "bg-[hsl(var(--severity-medium)/0.1)]",
      ring: "ring-[hsl(var(--severity-medium)/0.2)]",
    },
  ];

  return (
    <Card className="border-border/50 mb-8 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[hsl(var(--severity-medium)/0.12)]">
                <Lightbulb className="w-4 h-4 text-[hsl(var(--severity-medium))]" />
              </div>
              Learning Insights
            </CardTitle>
            <CardDescription className="mt-1">
              Patterns discovered from {insights.total_analyses} analyses
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs gap-1 shrink-0">
            <Sparkles className="w-3 h-3" />
            Auto-generated
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className={`relative flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-card ring-1 ${item.ring} transition-shadow hover:shadow-md`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${item.bg} shrink-0`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.label}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate leading-snug">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}