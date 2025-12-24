import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { calculateSprintProgress, logSprintEvent } from "@/lib/sprint-logic";
import {
  Plus,
  GripVertical,
  Clock,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  Edit2,
  X,
  Save,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: number;
  assignee_id: string | null;
  hours_estimated: number | null;
  hours_logged: number;
  due_date: string | null;
  assignee?: {
    full_name: string | null;
  };
}

interface SprintTaskBoardProps {
  sprintId: string;
  isFounder: boolean;
  isMember: boolean;
  sprintStatus: string;
  onProgressUpdate: () => void;
}

const columns = [
  { id: "todo", title: "To Do", icon: Circle },
  { id: "in_progress", title: "In Progress", icon: Loader2 },
  { id: "done", title: "Done", icon: CheckCircle2 },
];

export function SprintTaskBoard({
  sprintId,
  isFounder,
  isMember,
  sprintStatus,
  onProgressUpdate,
}: SprintTaskBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", hours_estimated: "" });

  const canEdit = (isFounder || isMember) && sprintStatus === "active";

  useEffect(() => {
    fetchTasks();
  }, [sprintId]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey (
          full_name
        )
      `)
      .eq("sprint_id", sprintId)
      .order("priority", { ascending: true });

    if (data) {
      setTasks(data as unknown as Task[]);
    }
    setLoading(false);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        sprint_id: sprintId,
        title: newTask.title,
        description: newTask.description || null,
        hours_estimated: newTask.hours_estimated ? parseInt(newTask.hours_estimated) : null,
        priority: tasks.length + 1,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding task", variant: "destructive" });
      return;
    }

    setTasks([...tasks, data as Task]);
    setNewTask({ title: "", description: "", hours_estimated: "" });
    setShowAddTask(false);

    // Update sprint to mark tasks assigned
    await supabase
      .from("sprints")
      .update({ tasks_assigned: true, last_activity_at: new Date().toISOString() })
      .eq("id", sprintId);

    await logSprintEvent(sprintId, "task_created", { task_title: newTask.title }, user?.id);
    toast({ title: "Task added" });
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("tasks")
      .update({ 
        status: newStatus,
        ...(newStatus === "done" ? { completed_at: new Date().toISOString() } : {})
      })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error updating task", variant: "destructive" });
      return;
    }

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

    // Update sprint progress
    await calculateSprintProgress(sprintId);
    
    // Update last activity
    await supabase
      .from("sprints")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sprintId);

    await logSprintEvent(
      sprintId,
      "task_status_changed",
      { task_title: task.title, old_status: task.status, new_status: newStatus },
      user?.id
    );

    onProgressUpdate();
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      toast({ title: "Error deleting task", variant: "destructive" });
      return;
    }

    setTasks(tasks.filter((t) => t.id !== taskId));
    await calculateSprintProgress(sprintId);

    if (task) {
      await logSprintEvent(sprintId, "task_deleted", { task_title: task.title }, user?.id);
    }

    onProgressUpdate();
    toast({ title: "Task deleted" });
  };

  const handleLogHours = async (taskId: string, hours: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newHours = (task.hours_logged || 0) + hours;

    const { error } = await supabase
      .from("tasks")
      .update({ hours_logged: newHours })
      .eq("id", taskId);

    if (error) return;

    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, hours_logged: newHours } : t)));

    // Update member hours
    if (user) {
      const { data: member } = await supabase
        .from("sprint_members")
        .select("hours_logged")
        .eq("sprint_id", sprintId)
        .eq("user_id", user.id)
        .single();

      if (member) {
        await supabase
          .from("sprint_members")
          .update({ hours_logged: (member.hours_logged || 0) + hours })
          .eq("sprint_id", sprintId)
          .eq("user_id", user.id);
      }
    }

    await logSprintEvent(sprintId, "hours_logged", { task_title: task.title, hours }, user?.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-founder"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Task Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button variant="founder" onClick={() => setShowAddTask(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      )}

      {/* Add Task Form */}
      {showAddTask && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={2}
                />
                <Input
                  type="number"
                  placeholder="Estimated hours (optional)"
                  value={newTask.hours_estimated}
                  onChange={(e) => setNewTask({ ...newTask, hours_estimated: e.target.value })}
                  className="w-48"
                />
                <div className="flex gap-2">
                  <Button variant="founder" onClick={handleAddTask}>
                    <Save className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddTask(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Task Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          const Icon = column.icon;

          return (
            <Card key={column.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon
                    className={`w-5 h-5 ${
                      column.id === "done"
                        ? "text-green-600"
                        : column.id === "in_progress"
                        ? "text-yellow-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  {column.title}
                  <Badge variant="secondary" className="ml-auto">
                    {columnTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[200px]">
                {columnTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {task.hours_estimated && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {task.hours_logged}/{task.hours_estimated}h
                          </Badge>
                        )}
                        {task.assignee?.full_name && (
                          <Badge variant="secondary" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {task.assignee.full_name}
                          </Badge>
                        )}
                      </div>

                      {/* Status Change Buttons */}
                      {canEdit && (
                        <div className="flex gap-1 mt-3">
                          {column.id !== "todo" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  column.id === "in_progress" ? "todo" : "in_progress"
                                )
                              }
                            >
                              ← Move Back
                            </Button>
                          )}
                          {column.id !== "done" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 ml-auto"
                              onClick={() =>
                                handleStatusChange(
                                  task.id,
                                  column.id === "todo" ? "in_progress" : "done"
                                )
                              }
                            >
                              Move Forward →
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Log Hours */}
                      {canEdit && column.id === "in_progress" && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">Log:</span>
                          {[1, 2, 4].map((h) => (
                            <Button
                              key={h}
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => handleLogHours(task.id, h)}
                            >
                              +{h}h
                            </Button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
