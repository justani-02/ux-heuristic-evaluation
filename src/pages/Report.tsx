import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnalysis, getAnalysisRuns, type AnalysisResult, type AnalysisRun } from "@/lib/api/analysis";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { IssueConfidenceBadge } from "@/components/IssueConfidenceBadge";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { TrustConfidenceSection } from "@/components/TrustConfidenceSection";
import { AppNav } from "@/components/AppNav";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, ExternalLink, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { UXImpactSummaryCard } from "@/components/UXImpactSummaryCard";
import { getConfidenceMap, type ConfidenceLevel } from "@/lib/api/learning";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [confidenceMap, setConfidenceMap] = useState<Map<string, { level: ConfidenceLevel; count: number }>>(new Map());

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getAnalysis(id),
      getAnalysisRuns(id),
      getConfidenceMap(),
    ]).then(([data, runsData, confMap]) => {
      setAnalysis(data);
      setRuns(runsData);
      setConfidenceMap(confMap);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container max-w-3xl mx-auto px-6 py-12 space-y-6">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-40" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Report not found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const date = new Date(analysis.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const runCount = analysis.run_count ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container max-w-3xl mx-auto px-6 py-8 print:py-4">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${analysis.id}`)} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            UX Heuristic Evaluation Report
          </h1>
          <p className="text-muted-foreground">{analysis.page_title || analysis.url}</p>
          <a href={analysis.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
            {analysis.url} <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-xs text-muted-foreground mt-2">{date}</p>
        </div>

        <Separator className="mb-8" />

        <TrustConfidenceSection analysis={analysis} runs={runs} />

        <UXImpactSummaryCard results={analysis.heuristic_results} />

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Executive Summary</h2>
          <p className="text-muted-foreground leading-relaxed">{analysis.summary || "No summary available."}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>UX Score</h2>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={analysis.overall_score || 0} size={100} strokeWidth={8} label="Overall" />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 flex-1">
                  <ScoreRing score={analysis.navigation_clarity_score || 0} size={60} strokeWidth={4} label="Nav" />
                  <ScoreRing score={analysis.information_hierarchy_score || 0} size={60} strokeWidth={4} label="Info" />
                  <ScoreRing score={analysis.feedback_visibility_score || 0} size={60} strokeWidth={4} label="Feedback" />
                  <ScoreRing score={analysis.error_prevention_score || 0} size={60} strokeWidth={4} label="Errors" />
                  <ScoreRing score={analysis.interaction_efficiency_score || 0} size={60} strokeWidth={4} label="Efficiency" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {analysis.screenshot_url && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Page Screenshot</h2>
            <Card className="border-border/50 overflow-hidden">
              <img src={analysis.screenshot_url} alt={`Screenshot of ${analysis.url}`} className="w-full h-auto" loading="lazy" />
            </Card>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Heuristic Results</h2>
          <div className="space-y-3">
            {analysis.heuristic_results.map((v, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-sm">{v.heuristic_name}</h3>
                    <div className="flex gap-1.5 shrink-0">
                      <SeverityBadge severity={v.severity} />
                      {v.risk_level && (
                        <Badge variant="outline" className="text-xs">Risk: {v.risk_level}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">Issue:</span> {v.issue}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-primary">Fix:</span> {v.recommendation}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                     <Badge variant="outline" className="text-xs">Impact: {v.impact || "–"}</Badge>
                     <Badge variant="outline" className="text-xs">Effort: {v.effort || "–"}</Badge>
                     {v.kpi_impact && <Badge variant="secondary" className="text-xs">{v.kpi_impact}</Badge>}
                     {(() => {
                       const conf = confidenceMap.get(v.heuristic_name);
                       return conf ? <ConfidenceBadge level={conf.level} count={conf.count} /> : <ConfidenceBadge level="Low" count={0} />;
                     })()}
                     {runCount > 1 && (
                       <IssueConfidenceBadge
                         occurrenceCount={v.occurrence_count ?? 1}
                         totalRuns={runCount}
                       />
                     )}
                   </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Nav: <strong className="text-foreground">{v.sub_scores?.["Navigation Clarity"] ?? "–"}</strong></span>
                    <span>Info: <strong className="text-foreground">{v.sub_scores?.["Information Hierarchy"] ?? "–"}</strong></span>
                    <span>Feedback: <strong className="text-foreground">{v.sub_scores?.["Feedback Visibility"] ?? "–"}</strong></span>
                    <span>Errors: <strong className="text-foreground">{v.sub_scores?.["Error Prevention"] ?? "–"}</strong></span>
                    <span>Efficiency: <strong className="text-foreground">{v.sub_scores?.["Interaction Efficiency"] ?? "–"}</strong></span>
                  </div>
                  <ExplainabilityPanel result={v} totalRuns={runCount} />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mb-6" />
        <p className="text-center text-xs text-muted-foreground pb-8">
          Generated by AI UX Heuristic Evaluator · Based on Nielsen Norman Group's 10 Usability Heuristics
        </p>
      </div>
    </div>
  );
}
