import { supabase } from "@/integrations/supabase/client";

export type HeuristicViolation = {
  heuristic: string;
  issue: string;
  severity: "Low" | "Medium" | "High";
  recommendation: string;
};

export type Recommendation = {
  title: string;
  problem: string;
  impact: string;
  solution: string;
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
  heuristic_violations: HeuristicViolation[];
  recommendations: Recommendation[];
  status: string;
  created_at: string;
};

export async function startAnalysis(url: string): Promise<AnalysisResult> {
  // 1. Create pending record
  const { data: record, error: insertError } = await supabase
    .from("analyses")
    .insert({ url, status: "scraping" })
    .select()
    .single();

  if (insertError || !record) throw new Error(insertError?.message || "Failed to create analysis");

  try {
    // 2. Scrape the website
    const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
      "firecrawl-scrape",
      { body: { url } }
    );

    if (scrapeError) throw new Error(scrapeError.message || "Scraping failed");
    if (!scrapeData?.success) throw new Error(scrapeData?.error || "Scraping failed");

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const screenshotUrl = scrapeData.data?.screenshot || scrapeData.screenshot || null;
    const pageTitle = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || null;

    // Update status
    await supabase
      .from("analyses")
      .update({ status: "analyzing", screenshot_url: screenshotUrl, page_title: pageTitle })
      .eq("id", record.id);

    // 3. Run AI analysis
    const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
      "ux-analyze",
      { body: { url, markdown, screenshot_url: screenshotUrl } }
    );

    if (analysisError) throw new Error(analysisError.message || "Analysis failed");
    if (!analysisData?.success) throw new Error(analysisData?.error || "Analysis failed");

    const result = analysisData.data;

    // 4. Save results
    const { data: updated, error: updateError } = await supabase
      .from("analyses")
      .update({
        status: "completed",
        page_title: result.page_title || pageTitle,
        summary: result.summary,
        screenshot_url: result.screenshot_url || screenshotUrl,
        overall_score: result.overall_score,
        navigation_clarity_score: result.navigation_clarity_score,
        information_hierarchy_score: result.information_hierarchy_score,
        feedback_visibility_score: result.feedback_visibility_score,
        error_prevention_score: result.error_prevention_score,
        interaction_efficiency_score: result.interaction_efficiency_score,
        heuristic_violations: result.heuristic_violations,
        recommendations: result.recommendations,
      })
      .eq("id", record.id)
      .select()
      .single();

    if (updateError || !updated) throw new Error("Failed to save results");

    return {
      ...updated,
      heuristic_violations: (updated.heuristic_violations as unknown as HeuristicViolation[]) || [],
      recommendations: (updated.recommendations as unknown as Recommendation[]) || [],
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
    heuristic_violations: (data.heuristic_violations as unknown as HeuristicViolation[]) || [],
    recommendations: (data.recommendations as unknown as Recommendation[]) || [],
  };
}
