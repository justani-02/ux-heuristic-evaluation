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

export async function startAnalysis(url: string): Promise<AnalysisResult> {
  const { data: record, error: insertError } = await supabase
    .from("analyses")
    .insert({ url, status: "scraping" })
    .select()
    .single();

  if (insertError || !record) throw new Error(insertError?.message || "Failed to create analysis");

  try {
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

    const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
      "ux-analyze",
      { body: { url, markdown, screenshot_url: screenshotUrl } }
    );

    if (analysisError) throw new Error(analysisError.message || "Analysis failed");
    if (!analysisData?.success) throw new Error(analysisData?.error || "Analysis failed");

    const result = analysisData.data;
    const heuristicResults: HeuristicResult[] = result.heuristic_results || [];

    const { data: updated, error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        page_title: result.page_title || pageTitle,
        summary: result.summary,
        screenshot_url: result.screenshot_url || screenshotUrl,
        overall_score: result.overall_score,
        navigation_clarity_score: avgSubScore(heuristicResults, "Navigation Clarity"),
        information_hierarchy_score: avgSubScore(heuristicResults, "Information Hierarchy"),
        feedback_visibility_score: avgSubScore(heuristicResults, "Feedback Visibility"),
        error_prevention_score: avgSubScore(heuristicResults, "Error Prevention"),
        interaction_efficiency_score: avgSubScore(heuristicResults, "Interaction Efficiency"),
        heuristic_violations: heuristicResults as any,
        recommendations: [] as any,
      })
      .eq("id", record.id)
      .select()
      .single();

    if (updateError || !updated) throw new Error("Failed to save results");

    // Generate tasks from heuristic results
    if (heuristicResults.length > 0) {
      const tasks = heuristicResults.map((hr) => ({
        analysis_id: record.id,
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

    return {
      ...updated,
      heuristic_results: (updated.heuristic_violations as unknown as HeuristicResult[]) || [],
    };
  } catch (err) {
    await supabase.from("analyses").update({ status: "failed" }).eq("id", record.id);
    throw err;
  }
}

export async function getAnalysis(id: string): Promise<AnalysisResult | null> {
  const { data, error } = await supabase.from("analyses").select().eq("id", id).single();
  if (error || !data) return null;
  return {
    ...data,
    heuristic_results: (data.heuristic_violations as unknown as HeuristicResult[]) || [],
  };
}

export async function getAllAnalyses(): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("status", "completed")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((d) => ({
    ...d,
    heuristic_results: (d.heuristic_violations as unknown as HeuristicResult[]) || [],
  }));
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
