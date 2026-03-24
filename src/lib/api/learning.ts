import { getAllAnalyses, getResolvedIssues, computeValidationStatus, type AnalysisResult, type HeuristicResult } from "./analysis";

export type TopFix = {
  heuristic_name: string;
  count: number;
  avg_score_improvement: number;
  avg_kpi_improvement: number;
  kpi_label: string;
};

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type LearningInsights = {
  most_impactful_heuristic: string | null;
  most_improved_kpi: string | null;
  most_common_issue: string | null;
  total_analyses: number;
};

export type HeuristicPerformance = {
  heuristic_name: string;
  times_improved: number;
  times_seen: number;
  avg_score_delta: number;
};

function getPairedAnalyses(analyses: AnalysisResult[]): { baseline: AnalysisResult; updated: AnalysisResult }[] {
  const pairs: { baseline: AnalysisResult; updated: AnalysisResult }[] = [];
  const byId = new Map(analyses.map((a) => [a.id, a]));
  for (const a of analyses) {
    if (a.previous_analysis_id) {
      const baseline = byId.get(a.previous_analysis_id);
      if (baseline) pairs.push({ baseline, updated: a });
    }
  }
  return pairs;
}

export async function getTopPerformingFixes(): Promise<TopFix[]> {
  const analyses = await getAllAnalyses();
  const pairs = getPairedAnalyses(analyses);

  const fixMap = new Map<string, { scoreDelta: number[]; kpiDelta: number[]; kpiLabel: string }>();

  for (const { baseline, updated } of pairs) {
    const status = computeValidationStatus(baseline, updated);
    if (status === "No Impact") continue;

    const resolved = getResolvedIssues(baseline, updated);
    const scoreDelta = (updated.overall_score || 0) - (baseline.overall_score || 0);
    const convDelta = (updated.conversion_rate ?? 0) - (baseline.conversion_rate ?? 0);

    for (const issue of resolved) {
      const entry = fixMap.get(issue.heuristic_name) || { scoreDelta: [], kpiDelta: [], kpiLabel: "Conversion %" };
      entry.scoreDelta.push(scoreDelta);
      entry.kpiDelta.push(convDelta);
      fixMap.set(issue.heuristic_name, entry);
    }
  }

  const results: TopFix[] = [];
  for (const [name, data] of fixMap) {
    results.push({
      heuristic_name: name,
      count: data.scoreDelta.length,
      avg_score_improvement: Math.round(data.scoreDelta.reduce((a, b) => a + b, 0) / data.scoreDelta.length),
      avg_kpi_improvement: +(data.kpiDelta.reduce((a, b) => a + b, 0) / data.kpiDelta.length).toFixed(2),
      kpi_label: data.kpiLabel,
    });
  }

  return results.sort((a, b) => b.avg_score_improvement - a.avg_score_improvement).slice(0, 5);
}

export async function getConfidenceScore(heuristicName: string): Promise<{ level: ConfidenceLevel; count: number }> {
  const analyses = await getAllAnalyses();
  const pairs = getPairedAnalyses(analyses);

  let successCount = 0;
  for (const { baseline, updated } of pairs) {
    const status = computeValidationStatus(baseline, updated);
    if (status === "No Impact") continue;
    const resolved = getResolvedIssues(baseline, updated);
    if (resolved.some((r) => r.heuristic_name === heuristicName)) successCount++;
  }

  const level: ConfidenceLevel = successCount >= 5 ? "High" : successCount >= 2 ? "Medium" : "Low";
  return { level, count: successCount };
}

export async function getConfidenceMap(): Promise<Map<string, { level: ConfidenceLevel; count: number }>> {
  const analyses = await getAllAnalyses();
  const pairs = getPairedAnalyses(analyses);

  const counts = new Map<string, number>();
  for (const { baseline, updated } of pairs) {
    const status = computeValidationStatus(baseline, updated);
    if (status === "No Impact") continue;
    const resolved = getResolvedIssues(baseline, updated);
    for (const r of resolved) {
      counts.set(r.heuristic_name, (counts.get(r.heuristic_name) || 0) + 1);
    }
  }

  const result = new Map<string, { level: ConfidenceLevel; count: number }>();
  for (const [name, count] of counts) {
    const level: ConfidenceLevel = count >= 5 ? "High" : count >= 2 ? "Medium" : "Low";
    result.set(name, { level, count });
  }
  return result;
}

export async function getLearningInsights(): Promise<LearningInsights> {
  const analyses = await getAllAnalyses();
  const pairs = getPairedAnalyses(analyses);

  // Most impactful heuristic
  const heuristicKpi = new Map<string, number[]>();
  for (const { baseline, updated } of pairs) {
    const resolved = getResolvedIssues(baseline, updated);
    const convDelta = (updated.conversion_rate ?? 0) - (baseline.conversion_rate ?? 0);
    for (const r of resolved) {
      const arr = heuristicKpi.get(r.heuristic_name) || [];
      arr.push(convDelta);
      heuristicKpi.set(r.heuristic_name, arr);
    }
  }

  let mostImpactful: string | null = null;
  let bestAvg = -Infinity;
  for (const [name, deltas] of heuristicKpi) {
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avg > bestAvg) { bestAvg = avg; mostImpactful = name; }
  }

  // Most improved KPI
  const kpiDeltas = { "Conversion Rate": 0, "Bounce Rate": 0, "Task Completion": 0, "Drop-off Rate": 0 };
  let pairCount = 0;
  for (const { baseline, updated } of pairs) {
    kpiDeltas["Conversion Rate"] += (updated.conversion_rate ?? 0) - (baseline.conversion_rate ?? 0);
    kpiDeltas["Bounce Rate"] += (baseline.bounce_rate ?? 0) - (updated.bounce_rate ?? 0); // lower is better
    kpiDeltas["Task Completion"] += (updated.task_completion_rate ?? 0) - (baseline.task_completion_rate ?? 0);
    kpiDeltas["Drop-off Rate"] += (baseline.drop_off_rate ?? 0) - (updated.drop_off_rate ?? 0);
    pairCount++;
  }
  const mostImprovedKpi = pairCount > 0
    ? Object.entries(kpiDeltas).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Most common issue
  const issueCounts = new Map<string, number>();
  for (const a of analyses) {
    for (const r of a.heuristic_results) {
      issueCounts.set(r.heuristic_name, (issueCounts.get(r.heuristic_name) || 0) + 1);
    }
  }
  let mostCommon: string | null = null;
  let maxCount = 0;
  for (const [name, count] of issueCounts) {
    if (count > maxCount) { maxCount = count; mostCommon = name; }
  }

  return {
    most_impactful_heuristic: mostImpactful,
    most_improved_kpi: mostImprovedKpi,
    most_common_issue: mostCommon,
    total_analyses: analyses.length,
  };
}

export async function getHeuristicPerformance(): Promise<HeuristicPerformance[]> {
  const analyses = await getAllAnalyses();
  const pairs = getPairedAnalyses(analyses);

  const seen = new Map<string, number>();
  const improved = new Map<string, number>();
  const scoreDeltas = new Map<string, number[]>();

  for (const a of analyses) {
    for (const r of a.heuristic_results) {
      seen.set(r.heuristic_name, (seen.get(r.heuristic_name) || 0) + 1);
    }
  }

  for (const { baseline, updated } of pairs) {
    const resolved = getResolvedIssues(baseline, updated);
    const delta = (updated.overall_score || 0) - (baseline.overall_score || 0);
    for (const r of resolved) {
      improved.set(r.heuristic_name, (improved.get(r.heuristic_name) || 0) + 1);
      const arr = scoreDeltas.get(r.heuristic_name) || [];
      arr.push(delta);
      scoreDeltas.set(r.heuristic_name, arr);
    }
  }

  const results: HeuristicPerformance[] = [];
  for (const [name, count] of seen) {
    const deltas = scoreDeltas.get(name) || [];
    results.push({
      heuristic_name: name,
      times_seen: count,
      times_improved: improved.get(name) || 0,
      avg_score_delta: deltas.length ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0,
    });
  }

  return results.sort((a, b) => b.times_improved - a.times_improved);
}
