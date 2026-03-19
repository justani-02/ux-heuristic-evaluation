import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { getAllTasks, updateTaskStatus, type Task } from "@/lib/api/analysis";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Clock, ListTodo, Filter, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusIcons = {
  "To Do": Circle,
  "In Progress": Clock,
  Done: CheckCircle2,
};

const statusColors = {
  "To Do": "text-muted-foreground",
  "In Progress": "text-[hsl(var(--severity-medium))]",
  Done: "text-[hsl(var(--severity-low))]",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<(Task & { analysis_url?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    getAllTasks().then((data) => {
      setTasks(data);
      setLoading(false);
    });
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: "To Do" | "In Progress" | "Done") => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      toast({ title: "Task updated", description: `Status changed to ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
  };

  const filtered = tasks.filter((t) => {
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const todoCount = tasks.filter((t) => t.status === "To Do").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const doneCount = tasks.filter((t) => t.status === "Done").length;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">UX Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Actionable tasks generated from heuristic analysis
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "To Do", count: todoCount, Icon: Circle, color: "text-muted-foreground" },
            { label: "In Progress", count: inProgressCount, Icon: Clock, color: "text-[hsl(var(--severity-medium))]" },
            { label: "Done", count: doneCount, Icon: CheckCircle2, color: "text-[hsl(var(--severity-low))]" },
          ].map(({ label, count, Icon, color }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={cn("w-5 h-5", color)} />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="To Do">To Do</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No tasks found</h3>
              <p className="text-sm text-muted-foreground">
                {tasks.length === 0
                  ? "Run a UX analysis to generate actionable tasks."
                  : "No tasks match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => {
              const StatusIcon = statusIcons[task.status];
              return (
                <Card
                  key={task.id}
                  className={cn(
                    "border-border/50 transition-all hover:shadow-sm",
                    task.status === "Done" && "opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <StatusIcon className={cn("w-4 h-4 shrink-0", statusColors[task.status])} />
                          <h3 className={cn("font-semibold text-sm", task.status === "Done" && "line-through")}>
                            {task.task_title}
                          </h3>
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 pl-6">{task.task_description}</p>
                        <div className="flex flex-wrap gap-1.5 pl-6">
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <Target className="w-3 h-3" /> Impact: {task.impact}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                            Effort: {task.effort}
                          </Badge>
                          {task.kpi_impact && (
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {task.kpi_impact}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <AlertTriangle className="w-3 h-3" /> Risk: {task.risk_level}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground px-2 py-0.5">
                            {task.linked_heuristic_name}
                          </Badge>
                        </div>
                        {task.analysis_url && (
                          <p className="text-[10px] text-muted-foreground mt-2 pl-6 truncate">{task.analysis_url}</p>
                        )}
                      </div>
                      <Select
                        value={task.status}
                        onValueChange={(v) => handleStatusChange(task.id, v as any)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To Do">To Do</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
