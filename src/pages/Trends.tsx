import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { getAllAnalyses, type AnalysisResult } from "@/lib/api/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

export default function Trends() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAnalyses().then((data) => {
      setAnalyses(data);
      setLoading(false);
    });
  }, []);

  const chartData = analyses.map((a) => ({
    date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Overall: a.overall_score || 0,
    Navigation: a.navigation_clarity_score || 0,
    Hierarchy: a.information_hierarchy_score || 0,
    Feedback: a.feedback_visibility_score || 0,
    "Error Prev.": a.error_prevention_score || 0,
    Efficiency: a.interaction_efficiency_score || 0,
    url: a.url,
  }));

  const latest = analyses[analyses.length - 1];
  const previous = analyses.length > 1 ? analyses[analyses.length - 2] : null;
  const scoreDelta = latest && previous
    ? (latest.overall_score || 0) - (previous.overall_score || 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            UX Score Trends
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track usability improvements over time
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-20" />
            <Skeleton className="h-80" />
          </div>
        ) : analyses.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No data yet</h3>
              <p className="text-sm text-muted-foreground">
                Run multiple UX analyses to see score trends over time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Latest Score</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {latest?.overall_score || 0}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Trend</p>
                  <div className="flex items-center gap-2">
                    {scoreDelta > 0 ? (
                      <TrendingUp className="w-5 h-5 text-[hsl(var(--severity-low))]" />
                    ) : scoreDelta < 0 ? (
                      <TrendingDown className="w-5 h-5 text-[hsl(var(--severity-high))]" />
                    ) : (
                      <Minus className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-2xl font-bold",
                      scoreDelta > 0 ? "text-[hsl(var(--severity-low))]" : scoreDelta < 0 ? "text-[hsl(var(--severity-high))]" : ""
                    )}>
                      {scoreDelta > 0 ? "+" : ""}{scoreDelta}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Analyses Run</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {analyses.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Avg Score</p>
                  <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {Math.round(analyses.reduce((a, b) => a + (b.overall_score || 0), 0) / analyses.length)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Overall Score Line Chart */}
            <Card className="border-border/50 mb-8">
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Overall UX Score Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Overall"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 5, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sub-score Trends */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Sub-Score Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Navigation" stroke="hsl(243, 75%, 59%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Hierarchy" stroke="hsl(167, 72%, 44%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Feedback" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Error Prev." stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Efficiency" stroke="hsl(280, 65%, 60%)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Analysis History */}
            <Card className="border-border/50 mt-8">
              <CardHeader>
                <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Analysis History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {[...analyses].reverse().map((a) => (
                    <a
                      key={a.id}
                      href={`/dashboard/${a.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.page_title || a.url}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.url}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {a.overall_score}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
