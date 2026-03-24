import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain,
  Sparkles,
  Users,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
} from "lucide-react";

interface SprintPlan {
  roles: { title: string; description: string; priority: string }[];
  phases: { name: string; startDay: number; endDay: number; description: string; deliverables: string[] }[];
  milestones: { title: string; day: number; description: string }[];
  deliverables: string[];
  riskFactors: string[];
}

interface GeneratedTask {
  title: string;
  description: string;
  suggestedRole: string;
  priority: string;
  estimatedHours: number;
  dueDay: number;
  selected: boolean;
}

interface AISprintPlannerProps {
  sprintId: string;
  ideaDescription: string;
  industry: string[];
  sprintDuration: number;
  onTasksCreated: () => void;
}

export function AISprintPlanner({
  sprintId,
  ideaDescription,
  industry,
  sprintDuration,
  onTasksCreated,
}: AISprintPlannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState<SprintPlan | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);

  const generatePlan = async () => {
    setLoadingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: {
          action: "generate_plan",
          sprintId,
          ideaDescription,
          industry: industry?.join(", ") || "General",
          sprintDuration,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPlan(data.plan);
      toast({ title: "Sprint plan generated!", description: "Review the AI-generated plan below." });
    } catch (e: any) {
      toast({ title: "Failed to generate plan", description: e.message, variant: "destructive" });
    } finally {
      setLoadingPlan(false);
    }
  };

  const generateTasks = async () => {
    if (!plan) return;
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-sprint-planner", {
        body: {
          action: "generate_tasks",
          sprintId,
          ideaDescription,
          sprintDuration,
          sprintPlan: plan,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedTasks((data.tasks || []).map((t: any) => ({ ...t, selected: true })));
      toast({ title: "Tasks generated!", description: "Review and confirm the tasks below." });
    } catch (e: any) {
      toast({ title: "Failed to generate tasks", description: e.message, variant: "destructive" });
    } finally {
      setLoadingTasks(false);
    }
  };

  const saveSelectedTasks = async () => {
    const selected = generatedTasks.filter((t) => t.selected);
    if (selected.length === 0) {
      toast({ title: "No tasks selected", variant: "destructive" });
      return;
    }

    setSavingTasks(true);
    try {
      const startDate = new Date();
      const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };

      const tasksToInsert = selected.map((t) => {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + t.dueDay);

        return {
          sprint_id: sprintId,
          title: t.title,
          description: t.description,
          priority: priorityMap[t.priority] || 2,
          hours_estimated: t.estimatedHours,
          due_date: dueDate.toISOString(),
          created_by: user?.id,
        };
      });

      const { error } = await supabase.from("tasks").insert(tasksToInsert);
      if (error) throw error;

      await supabase
        .from("sprints")
        .update({ tasks_assigned: true, last_activity_at: new Date().toISOString() })
        .eq("id", sprintId);

      toast({ title: `${selected.length} tasks created!` });
      onTasksCreated();
      setGeneratedTasks([]);
    } catch (e: any) {
      toast({ title: "Failed to save tasks", description: e.message, variant: "destructive" });
    } finally {
      setSavingTasks(false);
    }
  };

  const toggleTask = (index: number) => {
    setGeneratedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTask = (index: number, updates: Partial<GeneratedTask>) => {
    setGeneratedTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  };

  const removeTask = (index: number) => {
    setGeneratedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "low": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Plan */}
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Sprint Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!plan ? (
            <div className="text-center py-6">
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-4 opacity-60" />
              <p className="text-muted-foreground mb-4">
                Let AI generate a structured sprint plan with roles, phases, milestones, and deliverables.
              </p>
              <Button variant="founder" onClick={generatePlan} disabled={loadingPlan}>
                {loadingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Sprint Plan
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Roles */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" /> Required Roles
                </h3>
                <div className="grid gap-2">
                  {plan.roles.map((role, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-sm">{role.title}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                      <Badge className={getPriorityColor(role.priority)}>{role.priority}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phases */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" /> Sprint Phases
                </h3>
                <div className="space-y-2">
                  {plan.phases.map((phase, i) => (
                    <div key={i} className="rounded-lg border border-border overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedPhase(expandedPhase === i ? null : i)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            Day {phase.startDay}-{phase.endDay}
                          </Badge>
                          <span className="font-medium text-sm">{phase.name}</span>
                        </div>
                        {expandedPhase === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <AnimatePresence>
                        {expandedPhase === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-3 pb-3"
                          >
                            <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                            <div className="space-y-1">
                              {phase.deliverables.map((d, j) => (
                                <div key={j} className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className="w-3 h-3 text-primary" />
                                  {d}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4" /> Milestones
                </h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {plan.milestones.map((m, i) => (
                    <div key={i} className="relative pl-10 pb-4">
                      <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{m.title}</p>
                          <Badge variant="outline" className="text-xs">Day {m.day}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              {plan.riskFactors.length > 0 && (
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" /> Risk Factors
                  </h3>
                  <div className="space-y-1">
                    {plan.riskFactors.map((r, i) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-yellow-600 mt-0.5">•</span> {r}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Tasks Button */}
              <div className="flex gap-3">
                <Button variant="founder" onClick={generateTasks} disabled={loadingTasks}>
                  {loadingTasks ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Tasks...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Tasks from Plan
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={generatePlan} disabled={loadingPlan}>
                  Regenerate Plan
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Tasks Review */}
      {generatedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-Generated Tasks ({generatedTasks.filter((t) => t.selected).length}/{generatedTasks.length} selected)
              </span>
              <Button variant="founder" onClick={saveSelectedTasks} disabled={savingTasks}>
                {savingTasks ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Confirm & Create Tasks
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedTasks.map((task, i) => (
              <motion.div
                key={i}
                layout
                className={`p-4 rounded-xl border transition-colors ${
                  task.selected ? "border-primary/30 bg-primary/5" : "border-border opacity-50"
                }`}
              >
                {editingTask === i ? (
                  <div className="space-y-3">
                    <Input
                      value={task.title}
                      onChange={(e) => updateTask(i, { title: e.target.value })}
                      placeholder="Task title"
                    />
                    <Textarea
                      value={task.description}
                      onChange={(e) => updateTask(i, { description: e.target.value })}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <select
                        value={task.priority}
                        onChange={(e) => updateTask(i, { priority: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <Input
                        type="number"
                        value={task.estimatedHours}
                        onChange={(e) => updateTask(i, { estimatedHours: Number(e.target.value) })}
                        className="w-24"
                        placeholder="Hours"
                      />
                      <Input
                        type="number"
                        value={task.dueDay}
                        onChange={(e) => updateTask(i, { dueDay: Number(e.target.value) })}
                        className="w-24"
                        placeholder="Due day"
                      />
                      <Button size="sm" onClick={() => setEditingTask(null)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.selected}
                      onChange={() => toggleTask(i)}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <Badge variant="outline" className="text-xs">{task.suggestedRole}</Badge>
                        <Badge variant="secondary" className="text-xs">{task.estimatedHours}h</Badge>
                        <Badge variant="secondary" className="text-xs">Day {task.dueDay}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTask(i)}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTask(i)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
