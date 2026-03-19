import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAnalysis, type AnalysisResult } from "@/lib/api/analysis";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreOverview } from "@/components/dashboard/ScoreOverview";
import { SeveritySummary } from "@/components/dashboard/SeveritySummary";
import { HeuristicTable } from "@/components/dashboard/HeuristicTable";
import { ImpactEffortMatrix } from "@/components/ImpactEffortMatrix";
import { ArrowLeft, FileText, ExternalLink, ListTodo } from "lucide-react";

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAnalysis(id).then((data) => {
      setAnalysis(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-6 gap-6">
            <Skeleton className="h-48 md:col-span-2" />
            <Skeleton className="h-48 md:col-span-4" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Analysis not found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {analysis.page_title || analysis.url}
            </h1>
            <a
              href={analysis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
            >
              {analysis.url} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/tasks">
                <ListTodo className="w-4 h-4 mr-2" /> View Tasks
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/report/${analysis.id}`}>
                <FileText className="w-4 h-4 mr-2" /> Full Report
              </Link>
            </Button>
          </div>
        </div>

        <ScoreOverview analysis={analysis} />

        {(analysis.summary || analysis.screenshot_url) && (
          <SeveritySummary analysis={analysis} />
        )}

        <div className="mb-8">
          <ImpactEffortMatrix results={analysis.heuristic_results} />
        </div>

        <HeuristicTable results={analysis.heuristic_results} />
      </div>
    </div>
  );
}
