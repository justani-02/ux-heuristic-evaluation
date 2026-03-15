import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAnalysis, type AnalysisResult } from "@/lib/api/analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreRing } from "@/components/ScoreRing";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, ArrowLeft, FileText, ExternalLink, AlertTriangle, Lightbulb } from "lucide-react";

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
        <Nav />
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

  const highCount = analysis.heuristic_violations.filter((v) => v.severity === "High").length;
  const medCount = analysis.heuristic_violations.filter((v) => v.severity === "Medium").length;
  const lowCount = analysis.heuristic_violations.filter((v) => v.severity === "Low").length;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
          <Button asChild>
            <Link to={`/report/${analysis.id}`}>
              <FileText className="w-4 h-4 mr-2" /> View Full Report
            </Link>
          </Button>
        </div>

        {/* Score + Sub-scores */}
        <div className="grid md:grid-cols-6 gap-6 mb-8">
          <Card className="md:col-span-2 border-border/50">
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <ScoreRing score={analysis.overall_score || 0} size={140} strokeWidth={10} />
              <p className="mt-3 text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Overall UX Score
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-4 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Sub-Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <ScoreRing score={analysis.navigation_clarity_score || 0} size={72} strokeWidth={5} label="Navigation" />
                <ScoreRing score={analysis.information_hierarchy_score || 0} size={72} strokeWidth={5} label="Hierarchy" />
                <ScoreRing score={analysis.feedback_visibility_score || 0} size={72} strokeWidth={5} label="Feedback" />
                <ScoreRing score={analysis.error_prevention_score || 0} size={72} strokeWidth={5} label="Error Prev." />
                <ScoreRing score={analysis.interaction_efficiency_score || 0} size={72} strokeWidth={5} label="Efficiency" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary + screenshot */}
        {(analysis.summary || analysis.screenshot_url) && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {analysis.summary && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <Lightbulb className="w-4 h-4 text-primary" /> UX Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
                  <div className="flex gap-4 mt-4 text-sm">
                    <span className="text-[hsl(var(--severity-high))] font-medium">{highCount} High</span>
                    <span className="text-[hsl(var(--severity-medium))] font-medium">{medCount} Medium</span>
                    <span className="text-[hsl(var(--severity-low))] font-medium">{lowCount} Low</span>
                  </div>
                </CardContent>
              </Card>
            )}
            {analysis.screenshot_url && (
              <Card className="border-border/50 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Screenshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <img
                    src={analysis.screenshot_url}
                    alt={`Screenshot of ${analysis.url}`}
                    className="w-full h-auto max-h-64 object-cover object-top"
                    loading="lazy"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Heuristic Violations Table */}
        <Card className="border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <AlertTriangle className="w-4 h-4 text-primary" /> Heuristic Violations
            </CardTitle>
            <CardDescription>{analysis.heuristic_violations.length} issues found</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Heuristic</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.heuristic_violations.map((v, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{v.heuristic}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.issue}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={v.severity} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recommendation Cards */}
        {analysis.recommendations.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Lightbulb className="w-4 h-4 text-primary" /> Recommendations
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.recommendations.map((rec, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {rec.title}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium text-foreground">Problem:</span>{" "}<span className="text-muted-foreground">{rec.problem}</span></p>
                      <p><span className="font-medium text-foreground">Impact:</span>{" "}<span className="text-muted-foreground">{rec.impact}</span></p>
                      <p><span className="font-medium text-primary">Solution:</span>{" "}<span className="text-muted-foreground">{rec.solution}</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
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
