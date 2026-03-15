import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAnalysis, type AnalysisResult } from "@/lib/api/analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, ArrowLeft, Printer, ExternalLink } from "lucide-react";

export default function Report() {
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
        <Nav />
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

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="container max-w-3xl mx-auto px-6 py-8 print:py-4">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/${analysis.id}`)} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>

        {/* Report Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            UX Heuristic Evaluation Report
          </h1>
          <p className="text-muted-foreground">
            {analysis.page_title || analysis.url}
          </p>
          <a
            href={analysis.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
          >
            {analysis.url} <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-xs text-muted-foreground mt-2">{date}</p>
        </div>

        <Separator className="mb-8" />

        {/* Executive Summary */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Executive Summary
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {analysis.summary || "No summary available."}
          </p>
        </section>

        {/* UX Score */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            UX Score
          </h2>
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

        {/* Screenshot */}
        {analysis.screenshot_url && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Page Screenshot
            </h2>
            <Card className="border-border/50 overflow-hidden">
              <img
                src={analysis.screenshot_url}
                alt={`Screenshot of ${analysis.url}`}
                className="w-full h-auto"
                loading="lazy"
              />
            </Card>
          </section>
        )}

        {/* Heuristic Violations */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Heuristic Violations
          </h2>
          <div className="space-y-3">
            {analysis.heuristic_violations.map((v, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-sm">{v.heuristic}</h3>
                    <SeverityBadge severity={v.severity} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium text-foreground">Issue:</span> {v.issue}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">Fix:</span> {v.recommendation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Design Recommendations */}
        {analysis.recommendations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Design Recommendations
            </h2>
            {analysis.recommendations.map((rec, i) => (
              <Card key={i} className="border-border/50 mb-3">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {i + 1}. {rec.title}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Problem:</span> <span className="text-muted-foreground">{rec.problem}</span></p>
                    <p><span className="font-medium">Impact:</span> <span className="text-muted-foreground">{rec.impact}</span></p>
                    <p><span className="font-medium text-primary">Solution:</span> <span className="text-muted-foreground">{rec.solution}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <Separator className="mb-6" />
        <p className="text-center text-xs text-muted-foreground pb-8">
          Generated by AI UX Heuristic Evaluator · Based on Nielsen Norman Group's 10 Usability Heuristics
        </p>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 print:hidden">
      <div className="container mx-auto px-6 h-16 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            UX Evaluator
          </span>
        </Link>
      </div>
    </nav>
  );
}
