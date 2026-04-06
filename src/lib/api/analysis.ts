import { supabase } from "@/integrations/supabase/client";

export type HeuristicResult = {
  heuristic_name: string;
  issue: string;
  severity: "Low" | "Medium" | "High";
  recommendation: string;
  impact: "Low" | "Medium" | "High";
  effort: "Low" | "Medium" | "High";
  kpi_impact: string;
  risk_level: "Low" | "Medium" | "High";
  task_title: string;
  task_description: string;
  why_flagged?: string;
  evidence?: string;
  occurrence_count?: number;
  confidence_level?: "High" | "Medium" | "Low";
  sub_scores: {
    "Navigation Clarity": number;
    "Information Hierarchy": number;
    "Feedback Visibility": number;
    "Error Prevention": number;
    "Interaction Efficiency": number;
  };
};

export type AnalysisResult = {
  id: string;
  url: string;
  page_title: string | null;
  screenshot_url: string | null;
  summary: string | null;
  overall_score: number | null;
  navigation_clarity_score: number | null;
  information_hierarchy_score: number | null;
  feedback_visibility_score: number | null;
  error_prevention_score: number | null;
  interaction_efficiency_score: number | null;
  heuristic_results: HeuristicResult[];
  status: string;
  created_at: string;
  conversion_rate: number | null;
  bounce_rate: number | null;
  task_completion_rate: number | null;
  drop_off_rate: number | null;
  previous_analysis_id: string | null;
  confidence_score: number | null;
  run_count: number | null;
  analysis_mode: string | null;
};

export type Task = {
  id: string;
  analysis_id: string;
  task_title: string;
  task_description: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  linked_heuristic_name: string;
  impact: "High" | "Medium" | "Low";
  effort: "High" | "Medium" | "Low";
  kpi_impact: string | null;
  risk_level: "High" | "Medium" | "Low";
  created_at: string;
  updated_at: string;
};

export type AnalysisRun = {
  id: string;
  analysis_id: string;
  run_index: number;
  raw_output: any;
  overall_score: number | null;
  created_at: string;
};

export type ValidationStatus = "Improved" | "Partially Improved" | "No Impact";

function avgSubScore(results: HeuristicResult[], key: keyof HeuristicResult["sub_scores"]): number {
  if (!results.length) return 0;
  const sum = results.reduce((acc, r) => acc + (r.sub_scores?.[key] || 0), 0);
  return Math.round(sum / results.length);
}

function calcPriority(impact: string, effort: string): "High" | "Medium" | "Low" {
  if (impact === "High" && effort === "Low") return "High";
  if (impact === "High" && effort === "Medium") return "High";
  if (impact === "Medium" && effort === "Low") return "High";
  if (impact === "Low" && effort === "High") return "Low";
  return "Medium";
}

function mapAnalysis(data: any): AnalysisResult {
  return {
    ...data,
    heuristic_results: (data.heuristic_violations as unknown as HeuristicResult[]) || [],
    conversion_rate: data.conversion_rate ?? null,
    bounce_rate: data.bounce_rate ?? null,
    task_completion_rate: data.task_completion_rate ?? null,
    drop_off_rate: data.drop_off_rate ?? null,
    previous_analysis_id: data.previous_analysis_id ?? null,
    confidence_score: data.confidence_score ?? null,
    run_count: data.run_count ?? null,
    analysis_mode: data.analysis_mode ?? null,
  };
}

// --- Multi-run consensus logic ---

type RawRunResult = {
  page_title?: string;
  summary?: string;
  overall_score: number;
  heuristic_results: HeuristicResult[];
  screenshot_url?: string;
};

function issueKey(r: HeuristicResult): string {
  return `${r.heuristic_name}::${r.issue.toLowerCase().trim().substring(0, 80)}`;
}

function avgSeverity(severities: string[]): "Low" | "Medium" | "High" {
  const vals = severities.map(s => s === "High" ? 3 : s === "Medium" ? 2 : 1);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return avg >= 2.5 ? "High" : avg >= 1.5 ? "Medium" : "Low";
}

function mergeRuns(runs: RawRunResult[], totalRuns: number): {
  consensusResults: HeuristicResult[];
  overallScore: number;
  confidenceScore: number;
  summary: string;
  pageTitle: string;
} {
  // Group issues across runs
  const issueMap = new Map<string, { results: HeuristicResult[]; count: number }>();

  for (const run of runs) {
    for (const hr of run.heuristic_results) {
      const key = issueKey(hr);
      const entry = issueMap.get(key) || { results: [], count: 0 };
      entry.results.push(hr);
      entry.count++;
      issueMap.set(key, entry);
    }
  }

  // Keep issues that appear in at least 2 runs (or all if single run)
  const threshold = totalRuns > 1 ? 2 : 1;
  const consensusResults: HeuristicResult[] = [];

  for (const [, { results, count }] of issueMap) {
    if (count < threshold) continue;

    const base = results[0];
    const avgSubScores = {
      "Navigation Clarity": Math.round(results.reduce((s, r) => s + (r.sub_scores?.["Navigation Clarity"] || 0), 0) / results.length),
      "Information Hierarchy": Math.round(results.reduce((s, r) => s + (r.sub_scores?.["Information Hierarchy"] || 0), 0) / results.length),
      "Feedback Visibility": Math.round(results.reduce((s, r) => s + (r.sub_scores?.["Feedback Visibility"] || 0), 0) / results.length),
      "Error Prevention": Math.round(results.reduce((s, r) => s + (r.sub_scores?.["Error Prevention"] || 0), 0) / results.length),
      "Interaction Efficiency": Math.round(results.reduce((s, r) => s + (r.sub_scores?.["Interaction Efficiency"] || 0), 0) / results.length),
    };

    consensusResults.push({
      ...base,
      severity: avgSeverity(results.map(r => r.severity)),
      impact: avgSeverity(results.map(r => r.impact)),
      effort: avgSeverity(results.map(r => r.effort)),
      risk_level: avgSeverity(results.map(r => r.risk_level)),
      sub_scores: avgSubScores,
      occurrence_count: count,
      confidence_level: count >= totalRuns ? "High" : count >= 2 ? "Medium" : "Low",
      why_flagged: base.why_flagged || "",
      evidence: base.evidence || "",
    });
  }

  // Average overall scores
  const overallScore = Math.round(runs.reduce((s, r) => s + r.overall_score, 0) / runs.length);

  // Calculate confidence score based on consistency
  const scores = runs.map(r => r.overall_score);
  const scoreRange = Math.max(...scores) - Math.min(...scores);
  const scoreStability = Math.max(0, 100 - scoreRange * 2);

  const allIssueKeys = runs.map(r => new Set(r.heuristic_results.map(issueKey)));
  let overlapSum = 0;
  let pairCount = 0;
  for (let i = 0; i < allIssueKeys.length; i++) {
    for (let j = i + 1; j < allIssueKeys.length; j++) {
      const intersection = [...allIssueKeys[i]].filter(k => allIssueKeys[j].has(k)).length;
      const union = new Set([...allIssueKeys[i], ...allIssueKeys[j]]).size;
      overlapSum += union > 0 ? (intersection / union) * 100 : 100;
      pairCount++;
    }
  }
  const issueOverlap = pairCount > 0 ? overlapSum / pairCount : 100;

  const confidenceScore = Math.round(scoreStability * 0.4 + issueOverlap * 0.6);

  // Use longest summary
  const summary = runs.reduce((best, r) => (r.summary || "").length > best.length ? (r.summary || "") : best, "");
  const pageTitle = runs[0]?.page_title || "";

  return { consensusResults, overallScore, confidenceScore, summary, pageTitle };
}

// --- Single run executor ---
async function executeSingleRun(
  url: string,
  markdown: string,
  screenshotUrl: string | null
): Promise<RawRunResult> {
  const { data, error } = await supabase.functions.invoke("ux-analyze", {
    body: { url, markdown, screenshot_url: screenshotUrl },
  });
  if (error) throw new Error(error.message || "Analysis failed");
  if (!data?.success) throw new Error(data?.error || "Analysis failed");
  return data.data as RawRunResult;
}

export type AnalysisMode = "fast" | "reliable";

export async function startAnalysis(
  url: string,
  onProgress?: (stage: "scraping" | "analyzing" | "consistency" | "generating") => void,
  previousAnalysisId?: string,
  mode: AnalysisMode = "fast"
): Promise<AnalysisResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to run an analysis");

  const runCount = mode === "reliable" ? 3 : 1;

  const insertData: any = { url, status: "scraping", user_id: user.id, analysis_mode: mode, run_count: runCount };
  if (previousAnalysisId) insertData.previous_analysis_id = previousAnalysisId;

  const { data: record, error: insertError } = await supabase
    .from("analyses")
    .insert(insertData)
    .select()
    .single();

  if (insertError || !record) throw new Error(insertError?.message || "Failed to create analysis");

  try {
    onProgress?.("scraping");
    const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
      "firecrawl-scrape",
      { body: { url } }
    );

    if (scrapeError) throw new Error(scrapeError.message || "Scraping failed");
    if (!scrapeData?.success) throw new Error(scrapeData?.error || "Scraping failed");

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const screenshotUrl = scrapeData.data?.screenshot || scrapeData.screenshot || null;
    const pageTitle = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || null;

    await supabase
      .from("analyses")
      .update({ status: "analyzing", screenshot_url: screenshotUrl, page_title: pageTitle })
      .eq("id", record.id);

    onProgress?.("analyzing");

    // Execute runs (parallel for reliable mode)
    const runPromises: Promise<RawRunResult>[] = [];
    for (let i = 0; i < runCount; i++) {
      runPromises.push(executeSingleRun(url, markdown, screenshotUrl));
    }
    const runResults = await Promise.all(runPromises);

    // Store individual runs
    const runInserts = runResults.map((result, i) => ({
      analysis_id: record.id,
      run_index: i + 1,
      raw_output: result as any,
      overall_score: result.overall_score,
      user_id: user.id,
    }));
    await supabase.from("analysis_runs").insert(runInserts as any);

    if (runCount > 1) {
      onProgress?.("consistency");
    }

    // Merge results
    const { consensusResults, overallScore, confidenceScore, summary, pageTitle: aiPageTitle } =
      mergeRuns(runResults, runCount);

    onProgress?.("generating");
    const { data: updated, error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        page_title: aiPageTitle || pageTitle,
        summary,
        screenshot_url: runResults[0]?.screenshot_url || screenshotUrl,
        overall_score: overallScore,
        navigation_clarity_score: avgSubScore(consensusResults, "Navigation Clarity"),
        information_hierarchy_score: avgSubScore(consensusResults, "Information Hierarchy"),
        feedback_visibility_score: avgSubScore(consensusResults, "Feedback Visibility"),
        error_prevention_score: avgSubScore(consensusResults, "Error Prevention"),
        interaction_efficiency_score: avgSubScore(consensusResults, "Interaction Efficiency"),
        heuristic_violations: consensusResults as any,
        recommendations: [] as any,
        confidence_score: confidenceScore,
        run_count: runCount,
      })
      .eq("id", record.id)
      .select()
      .single();

    if (updateError || !updated) throw new Error("Failed to save results");

    if (consensusResults.length > 0) {
      const tasks = consensusResults.map((hr) => ({
        analysis_id: record.id,
        user_id: user.id,
        task_title: hr.task_title || `Fix: ${hr.issue.substring(0, 60)}`,
        task_description: hr.task_description || hr.recommendation,
        priority: calcPriority(hr.impact, hr.effort),
        status: "To Do" as const,
        linked_heuristic_name: hr.heuristic_name,
        impact: hr.impact || "Medium",
        effort: hr.effort || "Medium",
        kpi_impact: hr.kpi_impact || null,
        risk_level: hr.risk_level || "Medium",
      }));

      await supabase.from("tasks").insert(tasks as any);
    }

    return mapAnalysis(updated);
  } catch (err) {
    await supabase.from("analyses").update({ status: "failed" }).eq("id", record.id);
    throw err;
  }
}

export async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  const { data, error } = await supabase.from("analyses").select().eq("id", id).single();
  if (error || !data) return null;
  return mapAnalysis(data);
}

export async function getAnalysisRuns(analysisId: string): Promise<AnalysisRun[]> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .select()
    .eq("analysis_id", analysisId)
    .order("run_index", { ascending: true });
  if (error || !data) return [];
  return data as unknown as AnalysisRun[];
}

export async function getAllAnalyses(): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("status", "completed")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapAnalysis);
}

export async function getAnalysesByUrl(url: string): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("url", url)
    .eq("status", "completed")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapAnalysis);
}

export async function updateAnalysisKPIs(
  id: string,
  kpis: { conversion_rate?: number; bounce_rate?: number; task_completion_rate?: number; drop_off_rate?: number }
) {
  const { error } = await supabase.from("analyses").update(kpis as any).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getTasksForAnalysis(analysisId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select()
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data as unknown as Task[];
}

export async function getAllTasks(): Promise<(Task & { analysis_url?: string })[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, analyses(url)")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((t: any) => ({
    ...t,
    analysis_url: t.analyses?.url || undefined,
  })) as (Task & { analysis_url?: string })[];
}

export async function updateTaskStatus(taskId: string, status: "To Do" | "In Progress" | "Done") {
  const { error } = await supabase
    .from("tasks")
    .update({ status } as any)
    .eq("id", taskId);
  if (error) throw new Error(error.message);
}

export function computeValidationStatus(
  baseline: AnalysisResult,
  updated: AnalysisResult
): ValidationStatus {
  const scoreDelta = (updated.overall_score || 0) - (baseline.overall_score || 0);
  const kpiImproved =
    (updated.conversion_rate != null && baseline.conversion_rate != null && updated.conversion_rate > baseline.conversion_rate) ||
    (updated.bounce_rate != null && baseline.bounce_rate != null && updated.bounce_rate < baseline.bounce_rate) ||
    (updated.task_completion_rate != null && baseline.task_completion_rate != null && updated.task_completion_rate > baseline.task_completion_rate) ||
    (updated.drop_off_rate != null && baseline.drop_off_rate != null && updated.drop_off_rate < baseline.drop_off_rate);

  if (scoreDelta > 0 && kpiImproved) return "Improved";
  if (scoreDelta > 0 || kpiImproved) return "Partially Improved";
  return "No Impact";
}

export function getResolvedIssues(baseline: AnalysisResult, updated: AnalysisResult): HeuristicResult[] {
  const updatedIssues = new Set(updated.heuristic_results.map((r) => r.heuristic_name + ":" + r.issue));
  return baseline.heuristic_results.filter((r) => !updatedIssues.has(r.heuristic_name + ":" + r.issue));
}

export function getNewIssues(baseline: AnalysisResult, updated: AnalysisResult): HeuristicResult[] {
  const baselineIssues = new Set(baseline.heuristic_results.map((r) => r.heuristic_name + ":" + r.issue));
  return updated.heuristic_results.filter((r) => !baselineIssues.has(r.heuristic_name + ":" + r.issue));
}
