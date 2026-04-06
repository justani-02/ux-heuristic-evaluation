import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";
import { IssueConfidenceBadge } from "@/components/IssueConfidenceBadge";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { AlertTriangle } from "lucide-react";
import type { HeuristicResult } from "@/lib/api/analysis";
import { getConfidenceMap, type ConfidenceLevel } from "@/lib/api/learning";

function calcPriority(impact: string, effort: string): "High" | "Medium" | "Low" {
  if (impact === "High" && effort === "Low") return "High";
  if (impact === "High" && effort === "Medium") return "High";
  if (impact === "Medium" && effort === "Low") return "High";
  if (impact === "Low" && effort === "High") return "Low";
  return "Medium";
}

export function HeuristicTable({ results, runCount = 1 }: { results: HeuristicResult[]; runCount?: number }) {
  const [confidenceMap, setConfidenceMap] = useState<Map<string, { level: ConfidenceLevel; count: number }>>(new Map());

  useEffect(() => {
    getConfidenceMap().then(setConfidenceMap);
  }, []);

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" /> Heuristic Results
        </CardTitle>
        <CardDescription>{results.length} issues found</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Heuristic</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead className="w-[80px]">Severity</TableHead>
                <TableHead className="w-[90px]">Priority</TableHead>
                <TableHead className="w-[80px]">Impact</TableHead>
                <TableHead className="w-[80px]">Effort</TableHead>
                <TableHead className="w-[100px]">Confidence</TableHead>
                {runCount > 1 && <TableHead className="w-[80px]">Runs</TableHead>}
                <TableHead className="w-[120px]">KPI</TableHead>
                <TableHead>Recommendation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((v, i) => {
                const conf = confidenceMap.get(v.heuristic_name);
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{v.heuristic_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{v.issue}</div>
                      <ExplainabilityPanel result={v} totalRuns={runCount} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={v.severity} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={calcPriority(v.impact || "Medium", v.effort || "Medium")} />
                    </TableCell>
                    <TableCell>
                      <SeverityBadge severity={v.impact || "Medium"} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{v.effort || "Medium"}</Badge>
                    </TableCell>
                    <TableCell>
                      {conf ? (
                        <ConfidenceBadge level={conf.level} count={conf.count} compact />
                      ) : (
                        <ConfidenceBadge level="Low" count={0} compact />
                      )}
                    </TableCell>
                    {runCount > 1 && (
                      <TableCell>
                        <IssueConfidenceBadge
                          occurrenceCount={v.occurrence_count ?? 1}
                          totalRuns={runCount}
                          compact
                        />
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">{v.kpi_impact || "–"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.recommendation}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
