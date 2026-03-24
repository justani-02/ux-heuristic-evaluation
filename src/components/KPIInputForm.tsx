import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateAnalysisKPIs, type AnalysisResult } from "@/lib/api/analysis";
import { useToast } from "@/hooks/use-toast";
import { Save, BarChart3 } from "lucide-react";

const KPI_FIELDS = [
  { key: "conversion_rate", label: "Conversion Rate (%)", placeholder: "e.g. 3.2" },
  { key: "bounce_rate", label: "Bounce Rate (%)", placeholder: "e.g. 45.5" },
  { key: "task_completion_rate", label: "Task Completion (%)", placeholder: "e.g. 78.0" },
  { key: "drop_off_rate", label: "Drop-off Rate (%)", placeholder: "e.g. 22.3" },
] as const;

export function KPIInputForm({
  analysis,
  onUpdated,
  label = "KPI Metrics",
}: {
  analysis: AnalysisResult;
  onUpdated: (a: AnalysisResult) => void;
  label?: string;
}) {
  const [values, setValues] = useState({
    conversion_rate: analysis.conversion_rate?.toString() || "",
    bounce_rate: analysis.bounce_rate?.toString() || "",
    task_completion_rate: analysis.task_completion_rate?.toString() || "",
    drop_off_rate: analysis.drop_off_rate?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const kpis: any = {};
      for (const f of KPI_FIELDS) {
        const v = values[f.key];
        kpis[f.key] = v ? parseFloat(v) : null;
      }
      await updateAnalysisKPIs(analysis.id, kpis);
      onUpdated({ ...analysis, ...kpis });
      toast({ title: "KPIs saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {KPI_FIELDS.map((f) => (
          <div key={f.key}>
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input
              type="number"
              step="0.1"
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
        ))}
        <Button size="sm" onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-3 h-3 mr-1" />
          {saving ? "Saving..." : "Save KPIs"}
        </Button>
      </CardContent>
    </Card>
  );
}
