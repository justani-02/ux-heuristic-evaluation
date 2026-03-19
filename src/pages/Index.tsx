import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { startAnalysis } from "@/lib/api/analysis";
import { useToast } from "@/hooks/use-toast";
import { AppNav } from "@/components/AppNav";
import { AnalysisProgress, type AnalysisStage } from "@/components/AnalysisProgress";
import { Search, FileText, Zap, Shield, Eye, ArrowRight, Loader2, Target, TrendingUp } from "lucide-react";

const HEURISTICS = [
  { icon: Eye, title: "Visibility of Status", desc: "Is the system keeping users informed?" },
  { icon: Zap, title: "Efficiency of Use", desc: "Can expert users take shortcuts?" },
  { icon: Shield, title: "Error Prevention", desc: "Does the design prevent mistakes?" },
];

const FEATURES = [
  { icon: Target, title: "Impact & Effort Matrix", desc: "Prioritize fixes by impact vs effort with smart quadrant mapping" },
  { icon: FileText, title: "Task Generation", desc: "Auto-generate actionable tasks from heuristic findings" },
  { icon: TrendingUp, title: "Score Tracking", desc: "Track UX improvements over time with trend analysis" },
];

const STEPS = [
  { num: "01", title: "Enter URL", desc: "Paste any website URL you want to evaluate" },
  { num: "02", title: "AI Analysis", desc: "Our AI scrapes and evaluates against 10 heuristics" },
  { num: "03", title: "Get Report", desc: "Receive a detailed UX report with actionable insights" },
];

export default function Index() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<AnalysisStage>("scraping");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setStage("scraping");
    try {
      const result = await startAnalysis(url.trim(), (s) => setStage(s));
      navigate(`/dashboard/${result.id}`);
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      {loading ? (
        <section className="container mx-auto px-6 pt-24 pb-20">
          <AnalysisProgress stage={stage} />
        </section>
      ) : (
      <>
      {/* Hero */}
      <section className="container mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-3.5 h-3.5" />
            Powered by AI & Nielsen's 10 Heuristics
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            AI UX Heuristic
            <br />
            <span className="text-primary">Evaluator</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Analyze any website's usability in seconds. Get actionable insights, prioritized tasks,
            and decision intelligence based on Nielsen's proven heuristic framework.
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 h-12 text-base"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 font-semibold" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 pb-20">
        <h2 className="text-center text-2xl font-bold mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {STEPS.map((step) => (
            <Card key={step.num} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <span className="text-4xl font-bold text-primary/20" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {step.num}
                </span>
                <h3 className="text-lg font-semibold mt-2 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Decision Intelligence Features */}
      <section className="container mx-auto px-6 pb-20">
        <h2 className="text-center text-2xl font-bold mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Decision Intelligence
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Heuristics preview */}
      <section className="container mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          What we evaluate
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {HEURISTICS.map((h) => (
            <Card key={h.title} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <h.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{h.title}</h3>
                <p className="text-sm text-muted-foreground">{h.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          ...and 7 more heuristics from Nielsen Norman Group's framework
        </p>
      </section>

      <footer className="border-t border-border/50 py-8">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 | Built by Ananya Chandraker based on Jakob Nielsen's 10 Usability Heuristics
        </p>
      </footer>
      </>
      )}
    </div>
  );
}
